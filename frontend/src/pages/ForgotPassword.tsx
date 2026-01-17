import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Layout } from '../components/Layout';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.forgotPassword(email);
      setSuccess(response.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="form-container">
        <h2>Forgot Password</h2>
        <p style={{ marginBottom: '1.5rem', color: '#7f8c8d' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <Link to="/login" className="link">
          Back to login
        </Link>
      </div>
    </Layout>
  );
}
