import { useState, useEffect, FormEvent } from 'react';
import { api, Ticket, Comment, User } from '../services/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export function Tickets() {
  const { isAgent, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [ticketId: string]: Comment[] }>({});
  const [commentBody, setCommentBody] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [showAllTickets, setShowAllTickets] = useState(false);

  useEffect(() => {
    loadTickets();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, showAllTickets]);

  const loadTickets = async () => {
    try {
      const data = await api.getTickets(isAdmin && showAllTickets);
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const loadComments = async (ticketId: string) => {
    try {
      const data = await api.getComments(ticketId);
      setComments(prev => ({ ...prev, [ticketId]: data }));
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.createTicket(formData);
      setFormData({ title: '', description: '' });
      setShowForm(false);
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await api.updateTicket(ticketId, { status: newStatus });
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket');
    }
  };

  const handleAssignTicket = async (ticketId: string, agentId: string) => {
    try {
      await api.assignTicket(ticketId, agentId || null);
      setAssigningTicketId(null);
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket');
    }
  };

  const handleAddComment = async (e: FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    try {
      await api.addComment(ticketId, commentBody, commentInternal);
      setCommentBody('');
      setCommentInternal(false);
      await loadComments(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const toggleTicketExpand = (ticketId: string) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
    } else {
      setExpandedTicketId(ticketId);
      if (!comments[ticketId]) {
        loadComments(ticketId);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading tickets...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>My Tickets</h2>
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showAllTickets}
                  onChange={(e) => setShowAllTickets(e.target.checked)}
                />
                <span>Show All Tickets</span>
              </label>
            </div>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}

        <div className="create-ticket-btn">
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create New Ticket'}
          </button>
        </div>

        {showForm && (
          <div className="form-container" style={{ marginBottom: '2rem' }}>
            <h3>New Ticket</h3>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn">
                Create Ticket
              </button>
            </form>
          </div>
        )}

        {tickets.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
            No tickets yet. Create your first ticket!
          </p>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div>
                    <h3 className="ticket-title" style={{ cursor: 'pointer' }} onClick={() => toggleTicketExpand(ticket.id)}>
                      {ticket.title} {expandedTicketId === ticket.id ? '▼' : '▶'}
                    </h3>
                    <div className="ticket-meta">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      <span style={{ marginLeft: '1rem' }}>
                        • By: {ticket.user?.firstName} {ticket.user?.lastName}
                      </span>
                      {ticket.assignedTo && (
                        <span style={{ marginLeft: '1rem' }}>
                          • Assigned to: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                        </span>
                      )}
                      {!ticket.assignedTo && (
                        <span style={{ marginLeft: '1rem', color: '#dc3545' }}>• Unassigned</span>
                      )}
                    </div>
                  </div>
                  <span className={`ticket-status ${ticket.status}`}>{ticket.status}</span>
                </div>
                <p className="ticket-description">{ticket.description}</p>

                {/* Assignment Controls - Admin Only */}
                {isAdmin && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                    {assigningTicketId === ticket.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Assign to:</label>
                        <select 
                          onChange={(e) => handleAssignTicket(ticket.id, e.target.value)}
                          defaultValue={ticket.assignedToUserId || ''}
                          style={{ padding: '0.5rem', fontSize: '1rem', flex: 1 }}
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email}) - {user.role}
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setAssigningTicketId(null)} 
                          style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAssigningTicketId(ticket.id)} 
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}
                      >
                        {ticket.assignedTo ? 'Reassign' : 'Assign Ticket'}
                      </button>
                    )}
                  </div>
                )}

                <div className="ticket-actions">
                  {ticket.status !== 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'OPEN')}
                      style={{ 
                        backgroundColor: '#3498db', 
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Mark as Open
                    </button>
                  )}
                  {ticket.status !== 'IN_PROGRESS' && isAgent && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      style={{ 
                        backgroundColor: '#f39c12', 
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Mark as In Progress
                    </button>
                  )}
                  {ticket.status !== 'DONE' && isAgent && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'DONE')}
                      style={{ 
                        backgroundColor: '#27ae60', 
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Mark as Done
                    </button>
                  )}
                </div>

                {/* Expanded Comments Section */}
                {expandedTicketId === ticket.id && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    paddingTop: '1.5rem', 
                    borderTop: '2px solid #dee2e6' 
                  }}>
                    <h4 style={{ marginBottom: '1rem' }}>Comments</h4>
                    
                    {/* Comments List */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      {comments[ticket.id] && comments[ticket.id].length > 0 ? (
                        comments[ticket.id].map((comment) => (
                          <div 
                            key={comment.id} 
                            style={{ 
                              padding: '1rem', 
                              marginBottom: '0.5rem', 
                              backgroundColor: comment.isInternal ? '#fff3cd' : '#e9ecef',
                              borderRadius: '4px',
                              borderLeft: comment.isInternal ? '4px solid #ffc107' : '4px solid #6c757d'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#6c757d'
                            }}>
                              <span>
                                <strong>{comment.author?.firstName} {comment.author?.lastName}</strong>
                                {comment.isInternal && <span style={{ color: '#856404', marginLeft: '0.5rem' }}>(Internal)</span>}
                              </span>
                              <span>{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No comments yet</p>
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, ticket.id)}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Add Comment
                        </label>
                        <textarea
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          placeholder="Enter your comment..."
                          required
                          rows={3}
                          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                        />
                      </div>
                      
                      {isAgent && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={commentInternal}
                              onChange={(e) => setCommentInternal(e.target.checked)}
                            />
                            <span>Internal comment (only visible to agents/admins)</span>
                          </label>
                        </div>
                      )}
                      
                      <button type="submit" className="btn">
                        Add Comment
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
