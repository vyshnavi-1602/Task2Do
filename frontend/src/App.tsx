import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HeroPage from './pages/HeroPage';
import WorkspaceLayout from './pages/WorkspaceLayout';
import WorkspaceDashboardPage from './pages/WorkspaceDashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import MembersPage from './pages/MembersPage';
import ProjectLayout from './pages/ProjectLayout';
import BacklogPage from './pages/BacklogPage';
import BoardPage from './pages/BoardPage';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Configure TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/" element={<HeroPage />} />

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              <Route
                path="/workspaces/:workspaceId"
                element={
                  <ProtectedRoute>
                    <WorkspaceLayout />
                  </ProtectedRoute>
                }
              >
                {/* Redirect root workspace to dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<WorkspaceDashboardPage />} />
                <Route path="projects" element={<ProjectListPage />} />
                <Route path="members" element={<MembersPage />} />
              </Route>

              <Route
                path="/workspaces/:workspaceId/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="backlog" replace />} />
                <Route path="backlog" element={<BacklogPage />} />
                <Route path="board" element={<BoardPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
