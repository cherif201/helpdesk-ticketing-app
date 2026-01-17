import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { isAdmin } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <nav className="nav">
        <div className="nav-content">
          <h1>Helpdesk</h1>
          <div className="nav-links">
            {token ? (
              <>
                <Link to="/tickets">My Tickets</Link>
                <Link to="/inbox">My Inbox</Link>
                {isAdmin && <Link to="/admin/users">Manage Users</Link>}
                <Link to="/change-password">Change Password</Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="container">{children}</div>
    </div>
  );
}
