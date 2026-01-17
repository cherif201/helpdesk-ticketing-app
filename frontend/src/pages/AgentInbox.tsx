import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function AgentInbox() {
  const { isAgent } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAgent) {
        // Agents/admins see tickets assigned to them
        const data = await api.getInbox();
        setTickets(data);
      } else {
        // Regular users see all their own tickets
        const data = await api.getTickets();
        setTickets(data);
      }
    } catch (error: any) {
      console.error('Failed to load inbox', error);
      setError(error.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const inboxTitle = isAgent ? 'My Inbox (Assigned Tickets)' : 'My Inbox (All My Tickets)';
  const emptyMessage = isAgent 
    ? 'No tickets assigned to you' 
    : 'You have not created any tickets yet';

  return (
    <Layout>
      <div className="container">
        <h2>{inboxTitle} ({tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'})</h2>
        
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
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.title}</h3>
                  <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                </div>
                <p>{ticket.description}</p>
                <div className="ticket-meta">
                  <span><strong>Created By:</strong> {ticket.user?.firstName} {ticket.user?.lastName}</span>
                  <span style={{ marginLeft: '1rem' }}><strong>Date:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  {ticket.assignedTo && (
                    <span style={{ marginLeft: '1rem' }}><strong>Assigned To:</strong> {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                  )}
                </div>
                <Link to={`/tickets/${ticket.id}`} className="btn btn-sm">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
