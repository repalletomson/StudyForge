import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages
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

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <LoadingSpinner size="lg" />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

// Public route wrapper (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard/programs" replace />;
  
  return children;
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="/dashboard/programs" replace />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="programs/new" element={<NewProgramPage />} />
          <Route path="programs/:id" element={<ProgramDetailPage />} />
          <Route path="programs/:id/edit" element={<EditProgramPage />} />
          <Route path="publishing" element={<PublishingPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/programs" element={<Navigate to="/dashboard/programs" replace />} />
        <Route path="/publishing" element={<Navigate to="/dashboard/publishing" replace />} />
        <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;