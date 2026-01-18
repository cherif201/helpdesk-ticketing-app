import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Ticket, Inbox, Users, KeyRound, LogOut, BarChart3 } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { isAdmin } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/tickets" className="flex items-center space-x-2">
                <Ticket className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Helpdesk</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              {token ? (
                <>
                  {isAdmin && (
                    <Button variant="ghost" asChild>
                      <Link to="/dashboard" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                  )}

                  <Button variant="ghost" asChild>
                    <Link to="/tickets" className="flex items-center space-x-2">
                      <Ticket className="h-4 w-4" />
                      <span>My Tickets</span>
                    </Link>
                  </Button>

                  <Button variant="ghost" asChild>
                    <Link to="/inbox" className="flex items-center space-x-2">
                      <Inbox className="h-4 w-4" />
                      <span>My Inbox</span>
                    </Link>
                  </Button>

                  {isAdmin && (
                    <Button variant="ghost" asChild>
                      <Link to="/admin/users" className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Manage Users</span>
                      </Link>
                    </Button>
                  )}

                  <Button variant="ghost" asChild>
                    <Link to="/change-password" className="flex items-center space-x-2">
                      <KeyRound className="h-4 w-4" />
                      <span>Change Password</span>
                    </Link>
                  </Button>

                  <ThemeToggle />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
