import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AgentInbox() {
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
      const data = await api.getInbox();
      setTickets(data);
    } catch (error: any) {
      console.error('Failed to load inbox', error);
      setError(error.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">My Inbox (Assigned Tickets)</h2>
          <p className="text-muted-foreground mt-2">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tickets assigned to you
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
                        Created By: {ticket.user?.firstName} {ticket.user?.lastName} •{' '}
                        Date: {new Date(ticket.createdAt).toLocaleDateString()}
                        {ticket.assignedTo && (
                          <span> • Assigned To: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{ticket.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
