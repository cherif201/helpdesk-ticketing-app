import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './context/AuthContext';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { AdminUsers } from './pages/AdminUsers';
import { AgentInbox } from './pages/AgentInbox';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="helpdesk-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <AgentInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
