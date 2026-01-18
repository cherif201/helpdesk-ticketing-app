import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  doneTickets: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await api.getDashboardStatistics();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-2">System overview and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
              <p className="text-xs text-muted-foreground">All tickets in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting assignment or action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgressTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.doneTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
