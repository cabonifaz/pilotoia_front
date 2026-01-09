import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryAuthContext } from '../contexts/QueryAuthContext';
import { useMenuItems } from '../hooks/useMenuItems';
import { Loader } from '../components/loader/Loader';

interface GuardRouteProps {
  children: ReactNode;
}

export const GuardRoute = ({ children }: GuardRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, isLoggingOut, user } = useQueryAuthContext();
  const { allowedPaths, isLoading: menuLoading, error: menuError } = useMenuItems();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Get current path (first segment after root)
  // Examples: "/rag" → "rag", "/company" → "company", "/areas" → "areas"
  const currentPath = location.pathname.split('/').filter(Boolean)[0];

  // Public routes that don't require permission check
  const publicRoutes = ['unauthorized'];

  // Check if current route is allowed
  const isAllowed =
    !currentPath || // Root path
    publicRoutes.includes(currentPath) ||
    allowedPaths.includes(currentPath);

  // Redirect to unauthorized page if user tries to access forbidden route
  useEffect(() => {
    // Only check after menu items are loaded and user is authenticated
    if (!menuLoading && isAuthenticated && user && currentPath) {
      if (!isAllowed && !publicRoutes.includes(currentPath)) {
        console.warn(
          `[GuardRoute] Access denied to route: /${currentPath}. ` +
          `Allowed paths: ${allowedPaths.join(', ')}`
        );
        navigate('/unauthorized', { replace: true });
      }
    }
  }, [isAllowed, currentPath, allowedPaths, navigate, menuLoading, isAuthenticated, user]);

  // Show loader while checking authentication or loading menu
  if (authLoading || menuLoading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
        <Loader text={isLoggingOut ? 'Cerrando Sesión' : undefined} />
      </div>
    );
  }

  // Handle error loading menu items
  if (menuError) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'red',
        }}
      >
        <h1>Error al cargar permisos</h1>
        <p>No se pudieron cargar tus permisos. Por favor, intenta nuevamente.</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  // If not authenticated, don't render children (will be redirected)
  if (!isAuthenticated || !user) {
    return null;
  }

  // If not allowed and trying to access protected route, show nothing while redirecting
  if (!isAllowed && currentPath && !publicRoutes.includes(currentPath)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};