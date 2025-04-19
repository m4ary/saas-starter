import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function TendersPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Tenders Dashboard</h2>
        <Button asChild>
          <Link href="/api/synctenders">Sync Tenders</Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Browse Tenders</CardTitle>
            <CardDescription>View and search all tenders in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access the full list of tenders with advanced filtering options</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/tenders/browse">Browse</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>View sync logs and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Check the status of tender synchronization operations</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/tenders/sync">View Logs</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Tender statistics and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Visualize tender data and key performance indicators</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/tenders/analytics">View Analytics</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 