import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import TermsOfServiceGate from './components/TermsOfServiceGate';
import ChatbotWidget from './components/ChatbotWidget';

import { getStoredToken, getStoredUser, clearAuthSession } from './utils/authStorage';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const RefinementLabPage = lazy(() => import('./pages/RefinementLabPage'));
const PracticePage = lazy(() => import('./pages/PracticePage')); // Theater Mode Practice Engine
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const queryClient = new QueryClient();

const RouteFallback = ({ message = 'Loading interface...' }) => {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-400 flex items-center justify-center">
      <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm">
        {message}
      </div>
    </div>
  );
};

const withSuspense = (node, message) => {
  return <Suspense fallback={<RouteFallback message={message} />}>{node}</Suspense>;
};

const ProtectedScreen = ({ authState, onTermsAccepted, children }) => {
  if (!authState.token || !authState.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Suspense fallback={<RouteFallback message="Preparing your workspace..." />}>
        {children}
      </Suspense>
      <TermsOfServiceGate
        isOpen={!authState.user.hasAcceptedTerms}
        onAccepted={onTermsAccepted}
      />
    </div>
  );
};

const AnimatedRoutes = ({ authState, onAuthSuccess, onTermsAccepted, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(authState.token && authState.user);
  const needsTerms = Boolean(isAuthenticated && !authState.user?.hasAcceptedTerms);

  const handleAuthResolved = ({ token, user, mode }) => {
    onAuthSuccess({ token, user });

    if (mode === 'register') {
      navigate('/dashboard', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  const showRegisterGate = needsTerms && location.pathname === '/register';

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={withSuspense(<LandingPage />, 'Loading homepage...')} />
          <Route path="/home" element={withSuspense(<LandingPage />, 'Loading homepage...')} />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="min-h-screen w-full bg-black">
                  {withSuspense(
                    <AuthPage onBack={() => navigate('/')} onLogin={handleAuthResolved} />,
                    'Loading authentication...'
                  )}
                </div>
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated && authState.user?.hasAcceptedTerms ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="min-h-screen w-full bg-black">
                  {withSuspense(
                    <AuthPage defaultTab="register" onBack={() => navigate('/')} onLogin={handleAuthResolved} />,
                    'Loading authentication...'
                  )}
                </div>
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <DashboardPage onLogout={onLogout} />
              </ProtectedScreen>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <LibraryPage />
              </ProtectedScreen>
            }
          />
          <Route
            path="/lab"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <RefinementLabPage />
              </ProtectedScreen>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <PracticePage />
              </ProtectedScreen>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <AnalyticsPage />
              </ProtectedScreen>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedScreen authState={authState} onTermsAccepted={onTermsAccepted}>
                <SettingsPage />
              </ProtectedScreen>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      <TermsOfServiceGate
        isOpen={showRegisterGate}
        onAccepted={(updatedUser) => {
          onTermsAccepted(updatedUser);
          navigate('/dashboard', { replace: true });
        }}
      />
    </>
  );
};

const App = () => {
  const [authState, setAuthState] = React.useState(() => ({
    token: getStoredToken(),
    user: getStoredUser(),
  }));

  const handleAuthSuccess = ({ token, user }) => {
    setAuthState({ token, user });
  };

  const handleTermsAccepted = (updatedUser) => {
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthState({ token: null, user: null });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes
          authState={authState}
          onAuthSuccess={handleAuthSuccess}
          onTermsAccepted={handleTermsAccepted}
          onLogout={handleLogout}
        />
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: '#0b0b12',
            color: '#f3f4f6',
            border: '1px solid rgba(82,39,255,0.35)'
          }
        }}
      />
      <ChatbotWidget isEnabled={Boolean(authState.token)} />
    </QueryClientProvider>
  );
};

export default App;

