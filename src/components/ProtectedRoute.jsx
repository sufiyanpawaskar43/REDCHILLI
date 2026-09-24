import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Loading';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Loading session..." />;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
