import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api, User } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to load users', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setError('');
      setSuccess('User role updated successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to update role: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setError('');
      setSuccess('User deleted successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to delete user: ' + error.message);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'ADMIN' ? 'destructive' : 'default';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {users.length} user{users.length !== 1 ? 's' : ''} in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AGENT">AGENT</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
