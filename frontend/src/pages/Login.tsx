import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { PublicLayout } from '../components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect to tickets if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/tickets', { replace: true });
    }

    // Show success message from signup redirect
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.login(formData.email, formData.password);
      localStorage.setItem('token', response.token);

      // Redirect admin to dashboard, others to tickets
      if (response.user.role === 'ADMIN') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/tickets';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
