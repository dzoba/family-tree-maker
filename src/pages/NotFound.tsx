import { Link } from 'react-router-dom';
import { TreePine, Home } from 'lucide-react';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center px-4 py-32">
        <TreePine className="h-16 w-16 text-bark-300" />
        <h1 className="mt-6 font-serif text-4xl font-bold text-bark-800">
          Page not found
        </h1>
        <p className="mt-3 text-bark-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-8">
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}
