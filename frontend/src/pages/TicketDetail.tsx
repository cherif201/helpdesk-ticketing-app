import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket, Comment, User } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAgent, isAdmin } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
      loadComments();
      if (isAdmin) {
        loadUsers();
      }
    }
  }, [id, isAdmin]);

  const loadTicket = async () => {
    try {
      const tickets = await api.getTickets();
      const found = tickets.find((t: Ticket) => t.id === id);
      if (found) {
        setTicket(found);
      } else {
        setError('Ticket not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      const data = await api.getComments(id);
      setComments(data);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
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

  const handleUpdateStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    if (!id) return;
    try {
      await api.updateTicket(id, { status });
      await loadTicket();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleAssign = async (agentId: string) => {
    if (!id) return;
    try {
      await api.assignTicket(id, agentId || null);
      await loadTicket();
      setShowAssignDropdown(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    try {
      await api.deleteTicket(id);
      navigate('/tickets');
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;

    try {
      await api.addComment(id, commentBody, commentInternal);
      setCommentBody('');
      setCommentInternal(false);
      await loadComments();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <p>Loading ticket...</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Ticket Not Found</h2>
            <p>The ticket you're looking for doesn't exist or you don't have access to it.</p>
            <button onClick={() => navigate('/tickets')} className="btn">
              Back to Tickets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            marginBottom: '1rem', 
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

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

        {/* Ticket Header */}
        <div className="ticket-card" style={{ marginBottom: '2rem' }}>
          <div className="ticket-header">
            <h2 style={{ margin: 0 }}>{ticket.title}</h2>
            <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
              {ticket.status}
            </span>
          </div>

          <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>{ticket.description}</p>

          <div className="ticket-meta" style={{ marginBottom: '1rem' }}>
            <span><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</span>
            <span style={{ marginLeft: '2rem' }}><strong>Created By:</strong> {ticket.user?.firstName} {ticket.user?.lastName} ({ticket.user?.email})</span>
            {ticket.assignedTo && (
              <span style={{ marginLeft: '2rem' }}><strong>Assigned To:</strong> {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
            )}
            {!ticket.assignedTo && (
              <span style={{ marginLeft: '2rem', color: '#dc3545' }}><strong>Unassigned</strong></span>
            )}
          </div>

          {/* Status Update Buttons */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Update Status:</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleUpdateStatus('OPEN')}
                disabled={ticket.status === 'OPEN'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: ticket.status === 'OPEN' ? '#95a5a6' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ticket.status === 'OPEN' ? 'not-allowed' : 'pointer',
                  opacity: ticket.status === 'OPEN' ? 0.6 : 1
                }}
              >
                Open
              </button>
              <button
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                disabled={ticket.status === 'IN_PROGRESS'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: ticket.status === 'IN_PROGRESS' ? '#95a5a6' : '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ticket.status === 'IN_PROGRESS' ? 'not-allowed' : 'pointer',
                  opacity: ticket.status === 'IN_PROGRESS' ? 0.6 : 1
                }}
              >
                In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus('DONE')}
                disabled={ticket.status === 'DONE'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: ticket.status === 'DONE' ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ticket.status === 'DONE' ? 'not-allowed' : 'pointer',
                  opacity: ticket.status === 'DONE' ? 0.6 : 1
                }}
              >
                Done
              </button>
            </div>
          </div>

          {/* Assignment Section - Admin Only */}
          {isAdmin && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Assignment:</h4>
              {showAssignDropdown ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    onChange={(e) => handleAssign(e.target.value)}
                    defaultValue={ticket.assignedToUserId || ''}
                    style={{ padding: '0.5rem', fontSize: '1rem', minWidth: '200px' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setShowAssignDropdown(false)}
                    style={{ 
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAssignDropdown(true)}
                  style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {ticket.assignedTo ? 'Reassign Ticket' : 'Assign Ticket'}
                </button>
              )}
            </div>
          )}

          {/* Delete Section */}
          {(isAdmin || (ticket.userId === ticket.user?.id)) && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
              <button 
                onClick={handleDelete}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Delete Ticket
              </button>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
                {isAdmin ? 'Admin can delete any ticket' : 'You can delete tickets you created'}
              </p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="ticket-card">
          <h3 style={{ marginBottom: '1rem' }}>Comments ({comments.length})</h3>
          
          {comments.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No comments yet</p>
          ) : (
            <div style={{ marginBottom: '1.5rem' }}>
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  style={{ 
                    padding: '1rem', 
                    marginBottom: '0.75rem', 
                    backgroundColor: comment.isInternal ? '#fff3cd' : '#f8f9fa',
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
                      {comment.isInternal && <span style={{ color: '#856404', marginLeft: '0.5rem' }}>(Internal Note)</span>}
                    </span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} style={{ borderTop: '1px solid #dee2e6', paddingTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Add Comment</h4>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Enter your comment..."
              required
              rows={4}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '0.5rem' }}
            />
            
            {isAgent && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={commentInternal}
                    onChange={(e) => setCommentInternal(e.target.checked)}
                  />
                  <span>Internal note (only visible to agents/admins)</span>
                </label>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn"
              style={{ 
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Add Comment
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
