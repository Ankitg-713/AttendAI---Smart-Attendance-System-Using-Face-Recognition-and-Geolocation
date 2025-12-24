import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/axios';
import { ROLES, ROUTES } from '../config/constants';

/**
 * ProtectedRoute Component
 * Handles authentication and role-based access control
 * 
 * @param {ReactNode} children - The component to render if authorized
 * @param {string|string[]} allowedRoles - Role(s) allowed to access this route
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });
  
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: 'No token found',
        });
        return;
      }

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: res.data,
          error: null,
        });
      } catch (err) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: err.response?.data?.message || 'Authentication failed',
        });
      }
    };

    verifyAuth();
  }, []);

  // Show loading spinner while verifying
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check role-based access
  const userRole = authState.user?.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (allowedRoles && !roles.includes(userRole)) {
    // User is authenticated but doesn't have the right role
    // Redirect to their appropriate dashboard
    const redirectMap = {
      [ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD,
      [ROLES.TEACHER]: ROUTES.TEACHER_DASHBOARD,
      [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    };
    
    return <Navigate to={redirectMap[userRole] || ROUTES.LOGIN} replace />;
  }

  // User is authenticated and authorized
  return children;
}

/**
 * PublicOnlyRoute - For routes that should only be accessible when NOT logged in
 * (e.g., login, register pages)
 */
export function PublicOnlyRoute({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    userRole: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthState({ isLoading: false, isAuthenticated: false, userRole: null });
        return;
      }

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuthState({ 
          isLoading: false, 
          isAuthenticated: true, 
          userRole: res.data.role 
        });
      } catch {
        localStorage.removeItem('token');
        setAuthState({ isLoading: false, isAuthenticated: false, userRole: null });
      }
    };

    checkAuth();
  }, []);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (authState.isAuthenticated) {
    const redirectMap = {
      [ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD,
      [ROLES.TEACHER]: ROUTES.TEACHER_DASHBOARD,
      [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    };
    return <Navigate to={redirectMap[authState.userRole] || '/'} replace />;
  }

  return children;
}

