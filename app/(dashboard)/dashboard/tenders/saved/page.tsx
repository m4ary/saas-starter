import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Clock, Edit, Trash2, Eye, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function SavedFiltersPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  // Mock saved filters data
  const mockSavedFilters = [
    { 
      id: 1, 
      name: 'IT Services Tenders', 
      criteria: 'category:IT, keywords:"cloud, infrastructure, support"',
      lastRun: '2 hours ago',
      count: 127
    },
    { 
      id: 2, 
      name: 'Medical Equipment', 
      criteria: 'category:Healthcare, keywords:"equipment, supplies, medical"',
      lastRun: '1 day ago',
      count: 89
    },
    { 
      id: 3, 
      name: 'Government Construction', 
      criteria: 'category:Construction, client:Government, budget:>1000000',
      lastRun: '5 days ago',
      count: 54
    },
    { 
      id: 4, 
      name: 'Educational Services', 
      criteria: 'category:Education, keywords:"training, courses, educational"',
      lastRun: '2 weeks ago',
      count: 32
    },
    { 
      id: 5, 
      name: 'Transport & Logistics', 
      criteria: 'category:Transportation, keywords:"logistics, fleet, delivery"',
      lastRun: '1 month ago',
      count: 67
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Saved Filters</h2>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Filter
        </Button>
      </div>
      
      <div className="grid gap-3">
        {mockSavedFilters.map((filter) => (
          <Card key={filter.id} className="shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-grow p-4 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Bookmark className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <h3 className="font-medium truncate">{filter.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {filter.criteria}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Last run: {filter.lastRun}</span>
                  </div>
                  <div className="font-medium">
                    {filter.count} tenders
                  </div>
                </div>
              </div>
              <div className="flex border-t sm:border-t-0 sm:border-l bg-muted/30">
                <Button variant="ghost" size="sm" className="flex-1 rounded-none h-10" asChild>
                  <Link href={`/dashboard/tenders/browse?filter=${filter.id}`}>
                    <Eye className="mr-1 h-4 w-4 sm:mr-0 sm:h-3 sm:w-3" />
                    <span className="sm:hidden">View</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 rounded-none h-10 border-l border-r">
                  <Edit className="mr-1 h-4 w-4 sm:mr-0 sm:h-3 sm:w-3" />
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 rounded-none h-10 text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-1 h-4 w-4 sm:mr-0 sm:h-3 sm:w-3" />
                  <span className="sm:hidden">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 