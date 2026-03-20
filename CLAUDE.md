# Family Tree Maker

## Deployment
- Firebase project: `family-tree-maker-2e1f5`
- Deploy target: `family-tree-maker.web.app`
- Deploy command: `npm run build && firebase deploy`
- **Always execute Firebase deploy actions directly** — don't ask, just deploy. Auth, Firestore, and Hosting are all provisioned and ready.

## Tech Stack
- React 19 + Vite + TypeScript
- Tailwind CSS 3, PostCSS
- Firebase SDK 12 (Auth, Firestore, Hosting)
- React Router v7
- @xyflow/react (React Flow) for tree canvas
- dagre for auto-layout

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (outputs to dist/)
- `npm run lint` — ESLint check
- `firebase deploy` — deploy to Firebase Hosting
- `firebase deploy --only firestore:rules` — deploy security rules only

## Project Structure
- `src/pages/` — route page components
- `src/components/` — reusable UI components
- `src/hooks/` — React hooks (auth, tree CRUD, collaborators)
- `src/lib/` — utilities (firebase init, auth helpers, GEDCOM, layout)
- `src/types/` — TypeScript type definitions
- `firestore.rules` — Firestore security rules

## Design
- Warm, earthy color palette (cream, sage green, bark brown)
- Fonts: Inter (sans), Playfair Display (serif headings)
