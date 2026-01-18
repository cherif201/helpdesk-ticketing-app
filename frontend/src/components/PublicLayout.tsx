import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Ticket } from 'lucide-react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/login" className="flex items-center space-x-2">
                <Ticket className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Helpdesk</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
              <ThemeToggle />
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
