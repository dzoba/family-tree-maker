import { Link } from 'react-router-dom';
import { TreePine, Users, Share2, Download, ArrowRight, Map, CalendarDays, MousePointer2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

/* Inline SVG illustrations of the product */
function TreeEditorIllustration() {
  return (
    <svg viewBox="0 0 560 360" fill="none" className="w-full rounded-xl border border-bark-200 bg-cream-50 shadow-lg">
      {/* Canvas dots */}
      {Array.from({ length: 20 }).map((_, i) =>
        Array.from({ length: 12 }).map((_, j) => (
          <circle key={`${i}-${j}`} cx={28 * i + 14} cy={30 * j + 14} r="0.8" fill="#E0CDBA" />
        ))
      )}

      {/* Connection lines */}
      <line x1="280" y1="80" x2="180" y2="160" stroke="#A3BFA3" strokeWidth="2" />
      <line x1="280" y1="80" x2="380" y2="160" stroke="#A3BFA3" strokeWidth="2" />
      <line x1="180" y1="200" x2="120" y2="270" stroke="#A3BFA3" strokeWidth="2" />
      <line x1="180" y1="200" x2="240" y2="270" stroke="#A3BFA3" strokeWidth="2" />
      <line x1="380" y1="200" x2="380" y2="270" stroke="#A3BFA3" strokeWidth="2" />
      {/* Spouse line */}
      <line x1="210" y1="178" x2="320" y2="178" stroke="#f87171" strokeWidth="1.5" strokeDasharray="6 3" />

      {/* Person nodes */}
      {[
        { x: 230, y: 44, name: 'Grandpa', color: '#DBEAFE', border: '#93C5FD' },
        { x: 130, y: 144, name: 'Dad', color: '#DBEAFE', border: '#93C5FD' },
        { x: 330, y: 144, name: 'Mom', color: '#FCE7F3', border: '#F9A8D4' },
        { x: 70, y: 254, name: 'You', color: '#DBEAFE', border: '#93C5FD' },
        { x: 190, y: 254, name: 'Sister', color: '#FCE7F3', border: '#F9A8D4' },
        { x: 330, y: 254, name: 'Cousin', color: '#DBEAFE', border: '#93C5FD' },
      ].map((node) => (
        <g key={node.name}>
          <rect x={node.x} y={node.y} width="100" height="46" rx="10" fill="white" stroke={node.border} strokeWidth="2" />
          <rect x={node.x} y={node.y} width="4" height="46" rx="2" fill={node.border} />
          <circle cx={node.x + 22} cy={node.y + 23} r="10" fill={node.color} />
          <text x={node.x + 40} y={node.y + 20} fontSize="10" fontWeight="600" fill="#4D3427">
            {node.name}
          </text>
          <text x={node.x + 40} y={node.y + 32} fontSize="8" fill="#8B6B56">
            {node.name === 'Grandpa' ? 'b. 1940' : node.name === 'Dad' ? 'b. 1965' : node.name === 'Mom' ? 'b. 1968' : node.name === 'You' ? 'b. 1995' : node.name === 'Sister' ? 'b. 1998' : 'b. 1996'}
          </text>
          {/* Hover + button */}
          {node.name === 'You' && (
            <g>
              <circle cx={node.x + 50} cy={node.y + 52} r="8" fill="#5C8A5C" />
              <text x={node.x + 50} y={node.y + 56} fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">+</text>
            </g>
          )}
        </g>
      ))}

      {/* Selected ring on "You" */}
      <rect x="66" y="250" width="108" height="54" rx="13" fill="none" stroke="#5C8A5C" strokeWidth="2" strokeDasharray="0" opacity="0.5" />

      {/* Minimap */}
      <rect x="460" y="270" width="80" height="70" rx="6" fill="white" stroke="#E0CDBA" strokeWidth="1" />
      <rect x="475" y="280" width="50" height="30" rx="2" fill="#E6EDE6" opacity="0.5" />
      <rect x="485" y="288" width="20" height="10" rx="1" fill="#A3BFA3" opacity="0.4" />
    </svg>
  );
}

function TimelineIllustration() {
  return (
    <svg viewBox="0 0 340 240" fill="none" className="w-full rounded-xl border border-bark-200 bg-cream-50 shadow-lg">
      {/* Vertical line */}
      <line x1="40" y1="30" x2="40" y2="220" stroke="#E0CDBA" strokeWidth="1.5" />

      {/* Year marker */}
      <circle cx="40" cy="35" r="5" fill="white" stroke="#8B6B56" strokeWidth="1.5" />
      <text x="55" y="39" fontSize="10" fontWeight="700" fill="#8B6B56">1940</text>

      {/* Birth event */}
      <circle cx="40" cy="65" r="4" fill="#5C8A5C" />
      <rect x="58" y="52" width="240" height="30" rx="6" fill="white" stroke="#E6EDE6" strokeWidth="1" />
      <circle cx="74" cy="67" r="9" fill="#E6EDE6" />
      <text x="74" y="70" fontSize="7" textAnchor="middle" fill="#5C8A5C">B</text>
      <text x="90" y="64" fontSize="9" fontWeight="600" fill="#4D3427">Robert Smith was born</text>
      <text x="90" y="75" fontSize="8" fill="#8B6B56">Jan 15, 1940 · Chicago, IL</text>

      {/* Year marker */}
      <circle cx="40" cy="100" r="5" fill="white" stroke="#8B6B56" strokeWidth="1.5" />
      <text x="55" y="104" fontSize="10" fontWeight="700" fill="#8B6B56">1965</text>

      {/* Birth events */}
      <circle cx="40" cy="130" r="4" fill="#5C8A5C" />
      <rect x="58" y="117" width="240" height="30" rx="6" fill="white" stroke="#E6EDE6" strokeWidth="1" />
      <circle cx="74" cy="132" r="9" fill="#E6EDE6" />
      <text x="74" y="135" fontSize="7" textAnchor="middle" fill="#5C8A5C">B</text>
      <text x="90" y="129" fontSize="9" fontWeight="600" fill="#4D3427">Michael Smith was born</text>
      <text x="90" y="140" fontSize="8" fill="#8B6B56">Mar 8, 1965 · Chicago, IL</text>

      <circle cx="40" cy="165" r="4" fill="#5C8A5C" />
      <rect x="58" y="152" width="240" height="30" rx="6" fill="white" stroke="#E6EDE6" strokeWidth="1" />
      <circle cx="74" cy="167" r="9" fill="#E6EDE6" />
      <text x="74" y="170" fontSize="7" textAnchor="middle" fill="#5C8A5C">B</text>
      <text x="90" y="164" fontSize="9" fontWeight="600" fill="#4D3427">Sarah Johnson was born</text>
      <text x="90" y="175" fontSize="8" fill="#8B6B56">Jul 22, 1968 · Boston, MA</text>

      {/* Year marker */}
      <circle cx="40" cy="200" r="5" fill="white" stroke="#8B6B56" strokeWidth="1.5" />
      <text x="55" y="204" fontSize="10" fontWeight="700" fill="#8B6B56">1995</text>
    </svg>
  );
}

function ShareIllustration() {
  return (
    <svg viewBox="0 0 340 200" fill="none" className="w-full rounded-xl border border-bark-200 bg-cream-50 shadow-lg">
      {/* Browser-like header */}
      <rect x="20" y="20" width="300" height="160" rx="8" fill="white" stroke="#E0CDBA" strokeWidth="1" />
      <rect x="20" y="20" width="300" height="24" rx="8" fill="#F5E6D0" />
      <rect x="20" y="36" width="300" height="8" fill="#F5E6D0" />
      <circle cx="34" cy="32" r="4" fill="#f87171" opacity="0.6" />
      <circle cx="46" cy="32" r="4" fill="#fbbf24" opacity="0.6" />
      <circle cx="58" cy="32" r="4" fill="#5C8A5C" opacity="0.6" />
      <rect x="80" y="27" width="180" height="10" rx="5" fill="white" />
      <text x="105" y="35" fontSize="6" fill="#8B6B56">family-tree-maker.web.app/share/...</text>

      {/* Link card preview */}
      <rect x="40" y="60" width="260" height="80" rx="8" fill="#FEFDFB" stroke="#E0CDBA" strokeWidth="1" />
      <rect x="50" y="70" width="80" height="60" rx="4" fill="#E6EDE6" />
      {/* Mini tree in preview */}
      <circle cx="90" cy="85" r="6" fill="white" stroke="#A3BFA3" strokeWidth="1" />
      <circle cx="75" cy="105" r="5" fill="white" stroke="#A3BFA3" strokeWidth="1" />
      <circle cx="105" cy="105" r="5" fill="white" stroke="#A3BFA3" strokeWidth="1" />
      <line x1="90" y1="91" x2="75" y2="100" stroke="#A3BFA3" strokeWidth="1" />
      <line x1="90" y1="91" x2="105" y2="100" stroke="#A3BFA3" strokeWidth="1" />
      <line x1="70" y1="118" x2="110" y2="118" stroke="#E0CDBA" strokeWidth="0.5" />
      <text x="75" y="127" fontSize="5" fill="#8B6B56">family-tree-maker.web.app</text>

      <text x="145" y="82" fontSize="11" fontWeight="600" fill="#4D3427">The Smith Family Tree</text>
      <text x="145" y="96" fontSize="8" fill="#8B6B56">A family tree with 12 people.</text>
      <text x="145" y="110" fontSize="7" fill="#A3BFA3">family-tree-maker.web.app</text>

      {/* Share badge */}
      <rect x="40" y="150" width="60" height="20" rx="10" fill="#E6EDE6" />
      <text x="70" y="163" fontSize="7" textAnchor="middle" fill="#5C8A5C" fontWeight="600">Shared view</text>

      {/* No login needed text */}
      <text x="115" y="163" fontSize="8" fill="#8B6B56">No account needed to view</text>
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-sage-100/50 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-48 w-48 rounded-full bg-bark-100/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-medium text-sage-600">
                100% free. No subscription. No upsells.
              </p>

              <h1 className="font-serif text-4xl font-bold tracking-tight text-bark-900 sm:text-5xl">
                Family trees,<br />
                <span className="text-sage-600">without the headache</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-bark-600">
                Visual tree editor, real-time collaboration, sharing, GEDCOM support. Everything you'd expect from Ancestry, without the $30/month subscription or the constant upsells.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={user ? '/dashboard' : '/signup'}
                  className="btn-primary !px-8 !py-3 !text-base"
                >
                  {user ? 'Go to Dashboard' : 'Start Your Tree'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!user && (
                  <Link to="/login" className="btn-secondary !px-8 !py-3 !text-base">
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Hero illustration */}
            <div className="hidden lg:block">
              <TreeEditorIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* How it works - visual walkthrough */}
      <section className="border-t border-bark-100 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-bark-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-lg text-bark-600">
            Create a tree, add people, share it.
          </p>

          {/* Feature 1: Editor */}
          <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                <MousePointer2 className="h-3.5 w-3.5" />
                Visual editor
              </div>
              <h3 className="font-serif text-2xl font-bold text-bark-800">
                Drag, drop, connect
              </h3>
              <p className="mt-3 text-bark-600">
                Add people to a zoomable canvas. Hover any person to see + buttons for adding children, spouses, or parents. Right-click for more options. Two layout modes: auto (the computer keeps it tidy) or manual (you arrange everything yourself).
              </p>
            </div>
            <TreeEditorIllustration />
          </div>

          {/* Feature 2: Timeline + Map */}
          <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <TimelineIllustration />
                <div className="flex flex-col gap-4">
                  <div className="flex-1 rounded-xl border border-bark-200 bg-cream-50 p-4 shadow-lg">
                    <Map className="mb-2 h-5 w-5 text-sage-600" />
                    <p className="text-xs font-semibold text-bark-700">Map view</p>
                    <p className="mt-1 text-[10px] text-bark-500">
                      See where your family lived, moved, and settled. Birth and death locations plotted on an interactive map.
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl border border-bark-200 bg-cream-50 p-4 shadow-lg">
                    <CalendarDays className="mb-2 h-5 w-5 text-sage-600" />
                    <p className="text-xs font-semibold text-bark-700">Timeline view</p>
                    <p className="mt-1 text-[10px] text-bark-500">
                      Births and deaths laid out chronologically. Spot patterns across generations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Multiple views
              </div>
              <h3 className="font-serif text-2xl font-bold text-bark-800">
                See your family differently
              </h3>
              <p className="mt-3 text-bark-600">
                Switch between the tree canvas, a chronological timeline, and a geographic map. Each view shows something the others miss.
              </p>
            </div>
          </div>

          {/* Feature 3: Sharing */}
          <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                <Share2 className="h-3.5 w-3.5" />
                Sharing
              </div>
              <h3 className="font-serif text-2xl font-bold text-bark-800">
                One link, anyone can view
              </h3>
              <p className="mt-3 text-bark-600">
                Generate a share link and send it to anyone. They see the tree without needing to create an account. Paste the link in iMessage, Slack, or social media and it shows a preview card. Invite family members as collaborators to edit together in real time.
              </p>
            </div>
            <ShareIllustration />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-bark-100 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl font-bold text-bark-900">
            Also included
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: 'Real-time collaboration',
                description: 'Invite family members to edit. Changes sync instantly across devices.',
              },
              {
                icon: Download,
                title: 'GEDCOM import/export',
                description: 'Move data in and out. Compatible with Ancestry, FamilySearch, and others.',
              },
              {
                icon: TreePine,
                title: 'Auto-save everything',
                description: 'Every edit saves as you type. Activity log tracks who changed what.',
              },
              {
                icon: Map,
                title: 'Location autocomplete',
                description: 'Start typing a place name and it suggests matches from OpenStreetMap.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-bark-100 bg-white p-5">
                <feature.icon className="mb-3 h-5 w-5 text-sage-600" />
                <h3 className="text-sm font-semibold text-bark-800">{feature.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-bark-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-sage-600 px-8 py-14 text-center sm:px-16">
            <h2 className="font-serif text-3xl font-bold text-white">
              Your family's history, on your terms
            </h2>
            <p className="mt-3 text-sage-100">
              Free. No credit card. No subscription.
            </p>
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-medium text-sage-700 transition-all hover:bg-cream-50"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
