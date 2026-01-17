import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api, User } from '../services/api';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers(); // Get ALL users, not just agents
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
      await loadAgents();
    } catch (error: any) {
      setError('Failed to update role: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2>User Management</h2>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1rem', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-control"
                      style={{ maxWidth: '150px' }}
                    >
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
