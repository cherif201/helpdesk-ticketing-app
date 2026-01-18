import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket, Comment, User, AuditEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAgent, isAdmin } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
      loadComments();
      if (isAdmin) {
        loadUsers();
      }
      if (isAgent || isAdmin) {
        loadAuditTrail();
      }
    }
  }, [id, isAdmin, isAgent]);

  const loadTicket = async () => {
    if (!id) return;
    try {
      const data = await api.getTicket(id);
      setTicket(data);
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

  const loadAuditTrail = async () => {
    if (!id) return;
    try {
      const data = await api.getTicketAudit(id);
      setAuditEvents(data);
    } catch (err: any) {
      console.error('Failed to load audit trail:', err);
    }
  };

  const handleUpdateStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    if (!id) return;
    try {
      await api.updateTicket(id, { status });
      await loadTicket();
      if (isAgent || isAdmin) {
        await loadAuditTrail();
      }
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
      if (isAgent || isAdmin) {
        await loadAuditTrail();
      }
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'DONE':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading ticket...</div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>The ticket you're looking for doesn't exist or you don't have access to it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/tickets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Ticket Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                <CardDescription className="mt-2">
                  Created by {ticket.user?.firstName} {ticket.user?.lastName} on {new Date(ticket.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{ticket.description}</p>
            </div>

            <Separator />

            {/* Assignment Info */}
            <div>
              <h4 className="font-semibold mb-2">Assignment</h4>
              {ticket.assignedTo ? (
                <p className="text-sm">
                  Assigned to: <span className="font-medium">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </div>

            <Separator />

            {/* Status Update Buttons */}
            <div>
              <h4 className="font-semibold mb-3">Update Status</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleUpdateStatus('OPEN')}
                  disabled={ticket.status === 'OPEN'}
                  variant={ticket.status === 'OPEN' ? 'secondary' : 'default'}
                  className={ticket.status === 'OPEN' ? 'opacity-50' : ''}
                >
                  Mark as Open
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={ticket.status === 'IN_PROGRESS'}
                  variant={ticket.status === 'IN_PROGRESS' ? 'secondary' : 'default'}
                  className={ticket.status === 'IN_PROGRESS' ? 'opacity-50' : ''}
                >
                  Mark as In Progress
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('DONE')}
                  disabled={ticket.status === 'DONE'}
                  variant={ticket.status === 'DONE' ? 'secondary' : 'default'}
                  className={ticket.status === 'DONE' ? 'opacity-50' : ''}
                >
                  Mark as Done
                </Button>
              </div>
            </div>

            {/* Assignment Dropdown - Admin Only */}
            {isAdmin && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Assign Ticket</h4>
                  <Select
                    value={ticket.assignedToUserId || 'unassigned'}
                    onValueChange={(value) => handleAssign(value === 'unassigned' ? '' : value)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Audit Trail - Admin/Agent Only */}
            {(isAdmin || isAgent) && auditEvents.length > 0 && (
              <>
                <Separator />
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAuditTrail(!showAuditTrail)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      View History ({auditEvents.length} events)
                    </span>
                    {showAuditTrail ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showAuditTrail && (
                    <div className="mt-4 border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="text-sm">
                                {new Date(event.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm">
                                {event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : 'System'}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {event.action}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {event.metadata && typeof event.metadata === 'object'
                                  ? JSON.stringify(event.metadata)
                                  : event.metadata || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Delete Button */}
            {(isAdmin || (ticket.userId === ticket.user?.id)) && (
              <>
                <Separator />
                <div>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Ticket
                  </Button>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-2">
                      You can delete tickets you created
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground italic">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className={comment.isInternal ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Separator />

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-4">
              <div>
                <Label htmlFor="comment">Add Comment</Label>
                <Textarea
                  id="comment"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Enter your comment..."
                  required
                  rows={4}
                  className="mt-2"
                />
              </div>

              {isAgent && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="internal"
                    checked={commentInternal}
                    onCheckedChange={(checked) => setCommentInternal(checked as boolean)}
                  />
                  <Label htmlFor="internal" className="text-sm cursor-pointer">
                    Internal note (only visible to agents/admins)
                  </Label>
                </div>
              )}

              <Button type="submit">Add Comment</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
