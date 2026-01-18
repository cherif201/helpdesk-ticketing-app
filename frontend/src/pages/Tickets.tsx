import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, Ticket, User } from '../services/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export function Tickets() {
  const { isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
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
        <div className="text-center py-8">Loading tickets...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">My Tickets</h2>
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showAll"
                checked={showAllTickets}
                onCheckedChange={(checked) => setShowAllTickets(checked as boolean)}
              />
              <Label htmlFor="showAll" className="cursor-pointer">Show All Tickets</Label>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create New Ticket'}
        </Button>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Ticket</CardTitle>
              <CardDescription>Create a new support ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit">Create Ticket</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tickets yet. Create your first ticket!
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link to={`/tickets/${ticket.id}`}>
                        <CardTitle className="hover:underline cursor-pointer">
                          {ticket.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-2">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()} • By: {ticket.user?.firstName} {ticket.user?.lastName}
                        {ticket.assignedTo && (
                          <span> • Assigned to: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        )}
                        {!ticket.assignedTo && (
                          <span className="text-destructive"> • Unassigned</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{ticket.description}</p>

                  {/* Assignment Controls - Admin Only */}
                  {isAdmin && (
                    <div className="border-t pt-4">
                      {assigningTicketId === ticket.id ? (
                        <div className="flex gap-2 items-center">
                          <Label className="min-w-fit">Assign to:</Label>
                          <Select
                            defaultValue={ticket.assignedToUserId || 'unassigned'}
                            onValueChange={(value) => handleAssignTicket(ticket.id, value === 'unassigned' ? '' : value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            onClick={() => setAssigningTicketId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => setAssigningTicketId(ticket.id)}
                        >
                          {ticket.assignedTo ? 'Reassign' : 'Assign Ticket'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={ticket.status === 'OPEN' ? 'secondary' : 'default'}
                      disabled={ticket.status === 'OPEN'}
                      onClick={() => handleUpdateStatus(ticket.id, 'OPEN')}
                      size="sm"
                    >
                      Mark as Open
                    </Button>
                    <Button
                      variant={ticket.status === 'IN_PROGRESS' ? 'secondary' : 'default'}
                      disabled={ticket.status === 'IN_PROGRESS'}
                      onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      size="sm"
                    >
                      Mark as In Progress
                    </Button>
                    <Button
                      variant={ticket.status === 'DONE' ? 'secondary' : 'default'}
                      disabled={ticket.status === 'DONE'}
                      onClick={() => handleUpdateStatus(ticket.id, 'DONE')}
                      size="sm"
                    >
                      Mark as Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
