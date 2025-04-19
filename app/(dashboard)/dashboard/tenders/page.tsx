import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Tag, RefreshCw, Search, Eye, FileText, Filter } from 'lucide-react';
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
  const recentTenders = await getRecentTenders(6);
  const savedFilters = await getSavedFilters(String(user.id));

  return (
    <div className="space-y-6">
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
              <Link href="/dashboard/tenders/browse">
                <span>Browse all</span>
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
                <span>View new</span>
                <Clock className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Saved Filters</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedFilters.length}</div>
            <p className="text-xs text-muted-foreground">Custom saved searches</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="px-0 text-xs" asChild>
              <Link href="/dashboard/tenders/saved">
                <span>View saved</span>
                <Eye className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Last synced:</div>
            <div className="text-sm font-medium">Not available</div>
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

      <div className="grid gap-6 grid-cols-1">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tenders</CardTitle>
                <CardDescription>Latest tender opportunities</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/tenders/browse">
                    <Search className="h-4 w-4 mr-1" />
                    Browse All
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/dashboard/tenders/sync">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Sync
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Organization</th>
                    <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-24">Closing Date</th>
                    <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-24">Status</th>
                    <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground w-32 hidden md:table-cell">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenders.map((tender) => (
                    <tr key={tender.id} className="border-b">
                      <td className="p-2 px-4 align-middle">
                        <div className="font-medium">{tender.title}</div>
                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                          {tender.organization}
                        </div>
                      </td>
                      <td className="p-2 align-middle text-xs hidden md:table-cell">{tender.organization}</td>
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
                      <td className="p-2 align-middle hidden md:table-cell">
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
          <CardFooter className="border-t bg-muted/50 p-2">
            <div className="flex justify-center w-full">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/tenders/browse">View All Tenders</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 