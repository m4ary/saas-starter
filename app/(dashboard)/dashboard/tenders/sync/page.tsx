import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db/drizzle';
import { syncLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function SyncLogsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  // Fetch sync logs from the database
  const logs = await db.select().from(syncLogs).orderBy(desc(syncLogs.syncTime)).limit(20);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sync Logs</h2>
          <p className="text-muted-foreground">
            View the history of tender synchronization operations
          </p>
        </div>
        <Button asChild>
          <Link href="/api/synctenders">Run Sync Now</Link>
        </Button>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Authentication Update</AlertTitle>
        <AlertDescription className="text-yellow-700">
          We're currently updating the authentication system. If you encounter any issues, please use the "Authentication Test" page to check your session status.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date & Time</th>
                    <th scope="col" className="px-6 py-3">Total Tenders</th>
                    <th scope="col" className="px-6 py-3">New Tenders</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="bg-white border-b">
                      <td className="px-6 py-4">
                        {new Date(log.syncTime!).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{log.totalTenders}</td>
                      <td className="px-6 py-4">{log.newTendersCount}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p>No sync logs found. Run your first sync operation.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Sync Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You can customize the sync operation by adding parameters to the URL:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/api/synctenders?TenderCategory=2" className="block">
              <Card className="transition-all hover:bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-medium">Open Tenders</h3>
                  <p className="text-sm text-muted-foreground">Sync only open tenders (Category 2)</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/api/synctenders?TenderCategory=8" className="block">
              <Card className="transition-all hover:bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-medium">Closed Tenders</h3>
                  <p className="text-sm text-muted-foreground">Sync only closed tenders (Category 8)</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/api/synctenders?TenderAreasIdString=1" className="block">
              <Card className="transition-all hover:bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-medium">Riyadh Area</h3>
                  <p className="text-sm text-muted-foreground">Sync tenders from Riyadh area</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/api/synctenders?TenderActivityId=9" className="block">
              <Card className="transition-all hover:bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-medium">IT Tenders</h3>
                  <p className="text-sm text-muted-foreground">Sync IT and communication tenders</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 