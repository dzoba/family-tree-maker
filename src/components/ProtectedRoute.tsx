import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TreePine } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <TreePine className="h-8 w-8 animate-pulse text-sage-500" />
          <p className="text-sm text-bark-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
