import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Filter, Tag, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getTenderStats, getRecentTenders, getSavedFilters } from '@/lib/server/elasticsearch-service';
import { formatDate } from '@/lib/utils';

export default async function TendersPage() {
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
  const savedFilters = await getSavedFilters(String(user.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Tenders Dashboard</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/tenders/sync" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            Sync Tenders
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Total Tenders</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for your search criteria</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">New Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newTodayCount}</div>
            <p className="text-xs text-muted-foreground">Tenders added in the last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Saved Filters</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedFilters.length}</div>
            <p className="text-xs text-muted-foreground">Custom searches you've saved</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Tenders</CardTitle>
              <CardDescription className="text-xs">Latest tender opportunities</CardDescription>
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
                  <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-24">Closing Date</th>
                  <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-24">Status</th>
                  <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-32">Category</th>
                </tr>
              </thead>
              <tbody>
                {recentTenders.map((tender) => (
                  <tr key={tender.id} className="border-b">
                    <td className="p-2 px-4 align-middle font-medium">{tender.title}</td>
                    <td className="p-2 align-middle text-xs">{formatDate(tender.closingDate)}</td>
                    <td className="p-2 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        tender.remainingDays && tender.remainingDays < 5 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tender.remainingDays && tender.remainingDays < 5 ? 'Closing Soon' : tender.status}
                      </span>
                    </td>
                    <td className="p-2 align-middle">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Tag className="h-3 w-3" />
                        {tender.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 