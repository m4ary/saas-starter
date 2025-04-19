import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Filter, Tag, RefreshCw, Users, Bell, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import { getTenderStats, getRecentTenders } from '@/lib/server/elasticsearch-service';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  // Get real data from Elasticsearch service
  const stats = await getTenderStats();
  const recentTenders = await getRecentTenders(4);
  
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user.name || 'User'}
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available opportunities</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="px-0 text-xs" asChild>
              <Link href="/dashboard/tenders">
                <span>View all</span>
                <Eye className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newTodayCount}</div>
            <p className="text-xs text-muted-foreground">Added in last 24 hours</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="px-0 text-xs" asChild>
              <Link href="/dashboard/tenders/browse">
                <span>Browse new</span>
                <Eye className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.teamMembers?.length || 1}</div>
            <p className="text-xs text-muted-foreground">Active collaborators</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="px-0 text-xs" asChild>
              <Link href="/dashboard/profile/team">
                <span>Manage team</span>
                <Eye className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="text-sm text-muted-foreground">Not synced yet</span>
            </div>
            <p className="text-xs text-muted-foreground">Sync to get latest data</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="px-0 text-xs" asChild>
              <Link href="/dashboard/tenders/sync">
                <span>Sync now</span>
                <RefreshCw className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tenders</CardTitle>
                <CardDescription>Latest opportunities</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/tenders/browse">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenders.slice(0, 5).map((tender) => (
                    <tr key={tender.id} className="border-b">
                      <td className="p-2 px-4 align-middle font-medium">{tender.title}</td>
                      <td className="p-2 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          tender.remainingDays && tender.remainingDays < 5 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {tender.remainingDays && tender.remainingDays < 5 ? 'Closing Soon' : tender.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/tenders/sync">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Tenders
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/tenders/browse">
                <FileText className="mr-2 h-4 w-4" />
                Browse All Tenders
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/tenders/saved">
                <Tag className="mr-2 h-4 w-4" />
                View Saved Tenders
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/profile/team">
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
