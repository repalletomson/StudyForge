/**
 * Main App component with routing
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const ProgramsPage = lazy(() => import('./pages/ProgramsPage'));
const NewProgramPage = lazy(() => import('./pages/NewProgramPage'));
const EditProgramPage = lazy(() => import('./pages/EditProgramPage'));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const PublishingPage = lazy(() => import('./pages/PublishingPage'));

/**
 * Protected Route component
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * Public Route component (redirect if authenticated)
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard/programs" replace />;
  }
  
  return children;
};

/**
 * Main App component
 */
function App() {
  return (
    <div className="App">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Routes>
          {/* Landing page */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/programs" replace />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/new" element={<NewProgramPage />} />
            <Route path="programs/:id" element={<ProgramDetailPage />} />
            <Route path="programs/:id/edit" element={<EditProgramPage />} />
            <Route path="publishing" element={<PublishingPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          
          {/* Legacy redirect for authenticated users */}
          <Route path="/programs" element={<Navigate to="/dashboard/programs" replace />} />
          <Route path="/publishing" element={<Navigate to="/dashboard/publishing" replace />} />
          <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;