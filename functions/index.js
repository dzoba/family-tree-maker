const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const db = admin.firestore();

const BOT_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|iMessageLinkPreview/i;

const escapeHtml = (str) =>
  str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

// Read the SPA index.html at cold start so we can serve it for real browsers
let spaHtml = null;
function getSpaHtml() {
  if (spaHtml) return spaHtml;
  try {
    // In Firebase Hosting + Functions, the hosting files aren't directly accessible.
    // We bundle a copy of index.html with the function.
    spaHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  } catch {
    spaHtml = null;
  }
  return spaHtml;
}

exports.shareOg = onRequest({ region: "us-central1" }, async (req, res) => {
  // Security headers
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const parts = req.path.split("/share/");
  const shareId = parts[1] ? parts[1].split("/")[0].split("?")[0] : null;

  if (!shareId) {
    res.redirect("/");
    return;
  }

  const ua = req.headers["user-agent"] || "";
  const isBot = BOT_UA.test(ua);

  if (!isBot) {
    // Real browser — serve the SPA so client-side routing handles /share/:id
    const html = getSpaHtml();
    if (html) {
      res.status(200).set("Content-Type", "text/html").send(html);
    } else {
      // Fallback: redirect to root (SPA will handle via History API)
      res.redirect(302, `/share/${shareId}`);
    }
    return;
  }

  // Bot request — dynamic OG tags
  try {
    const snap = await db.collection("trees").where("shareId", "==", shareId).limit(1).get();

    if (snap.empty) {
      res.status(404).send("Not found");
      return;
    }

    const tree = snap.docs[0].data();
    const treeId = snap.docs[0].id;
    const treeName = escapeHtml(tree.name || "Family Tree");
    const treeDesc = escapeHtml(tree.description || "");

    // Count people
    const peopleSnap = await db.collection("trees").doc(treeId).collection("people").count().get();
    const peopleCount = peopleSnap.data().count;
    const desc = peopleCount > 0
      ? `A family tree with ${peopleCount} ${peopleCount === 1 ? "person" : "people"}. ${treeDesc}`
      : treeDesc || "View this family tree on Family Tree Maker.";

    const url = `https://family-tree-maker.web.app/share/${encodeURIComponent(shareId)}`;
    const ogImage = "https://family-tree-maker.web.app/og-image.png";

    res.status(200).set("Content-Type", "text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${treeName} — Family Tree Maker</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta property="og:title" content="${treeName}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${treeName}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${ogImage}">
</head>
<body>
  <p>Loading <a href="${url}">${treeName}</a>...</p>
</body>
</html>`);
  } catch (err) {
    console.error("shareOg error:", err?.message || "unknown error");
    res.status(500).send("Internal error");
  }
});
