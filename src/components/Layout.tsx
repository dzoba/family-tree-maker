import { Link, useNavigate } from 'react-router-dom';
import { TreePine, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-bark-100 bg-white/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <TreePine className="h-6 w-6 text-sage-600" />
            <span className="font-serif text-xl font-semibold text-bark-800">
              Family Tree Maker
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-7 w-7 rounded-full bg-sage-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-sage-700">
                      {(user.displayName || user.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-bark-600">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button onClick={handleSignOut} className="btn-ghost text-bark-500">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-bark-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-bark-500">
              <TreePine className="h-4 w-4" />
              <span className="text-sm">Family Tree Maker</span>
            </div>
            <p className="text-sm text-bark-400">
              Preserve your family's story for generations to come.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
