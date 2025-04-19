'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { signOutClient } from '@/lib/auth/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, Save, X, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

// Import the valid tender activity IDs
const VALID_TENDER_ACTIVITY_IDS = {
  1: "التجارة",
  2: "المقاولات",
  3: "التشغيل والصيانة والنظافة للمنشآت",
  4: "العقارات والأراضي",
  5: "الصناعة والتعدين والتدوير",
  6: "الغاز والمياه والطاقة",
  7: "المناجم والبترول والمحاجر",
  8: "الإعلام والنشر والتوزيع",
  9: "الاتصالات وتقنية المعلومات",
  10: "الزراعة والصيد",
  11: "الرعاية الصحية والنقاهة",
  12: "التعليم والتدريب",
  13: "التوظيف والاستقدام",
  14: "الأمن والسلامة",
  15: "النقل والبريد والتخزين",
  16: "المهن الاستشارية",
  17: "السياحة والمطاعم والفنادق وتنظيم المعارض",
  18: "المالية والتمويل والتأمين",
  19: "الخدمات الأخرى",
  101: "تجارة المواد الغذائية",
  111: "تجارة قطع الغيار الجديدة",
  119: "مستودعات الادوية والصيدليات - المستلزمات الطبية",
};

// Valid tender areas (kept for consistency)
const VALID_TENDER_AREA_IDS = {
  1: "منطقة الرياض",
  2: "منطقة مكة المكرمة",
  3: "منطقة المدينة المنورة",
  4: "منطقة القصيم",
  5: "المنطقة الشرقية",
  6: "منطقة عسير",
  7: "منطقة تبوك",
  8: "منطقة حائل",
  9: "منطقة الحدود الشمالية",
  10: "منطقة جازان",
  11: "منطقة نجران",
  12: "منطقة الباحة",
  13: "منطقة الجوف"
};

interface Tender {
  tenderId: string;
  tenderName: string;
  tenderNumber: string;
  agencyName: string;
  tenderIdString: string;
  lastOfferPresentationDate?: string;
  tenderStatusName?: string;
  tenderActivityName?: string;
  branchName?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  criteria: {
    agencyName?: string;
    tenderActivityId?: string;
    tenderAreasId?: string;
    keywords?: string;
  };
  lastRun: string;
  count: number;
}

export default function BrowseTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [tenderActivityId, setTenderActivityId] = useState('all');
  const [tenderAreasId, setTenderAreasId] = useState('all');
  const [keywords, setKeywords] = useState('');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [activeTab, setActiveTab] = useState('search');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const { toast } = useToast();
  const limit = 10;

  // Group activity IDs by main category
  const groupedActivityIds = Object.entries(VALID_TENDER_ACTIVITY_IDS).reduce<Record<string, Record<string, string>>>((acc, [id, name]) => {
    const idStr = id.toString();
    const mainCategory = idStr.length === 1 ? idStr : idStr.charAt(0);
    
    if (!acc[mainCategory]) {
      acc[mainCategory] = {};
    }
    
    acc[mainCategory][id] = name;
    return acc;
  }, {});

  // Fetch saved filters
  const fetchSavedFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const response = await fetch('/api/filters');
      
      if (response.status === 401 || response.status === 403) {
        // If unauthorized, redirect to sign-in
        setError('Session expired. Please sign in again.');
        setTimeout(() => signOutClient(), 2000);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error fetching saved filters: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSavedFilters(data || []);
    } catch (err) {
      console.error('Error fetching saved filters:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedFilters();
  }, [fetchSavedFilters]);

  const fetchTenders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (agencyName) queryParams.append('agencyName', agencyName);
      if (tenderActivityId && tenderActivityId !== 'all') queryParams.append('tenderActivityId', tenderActivityId);
      if (tenderAreasId && tenderAreasId !== 'all') queryParams.append('tenderAreasId', tenderAreasId);
      if (keywords) queryParams.append('keywords', keywords);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await fetch(`/api/tenders?${queryParams.toString()}`);
      
      if (response.status === 401 || response.status === 403) {
        // If unauthorized, redirect to sign-in
        setError('Session expired. Please sign in again.');
        setTimeout(() => signOutClient(), 2000);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error fetching tenders: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTenders(data.results || []);
      setTotalResults(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      fetchTenders();
    }
  }, [page, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchTenders();
  };

  const handleNextPage = () => {
    if (page * limit < totalResults) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    // Apply the saved filter criteria to the search form
    setAgencyName(filter.criteria.agencyName || '');
    setTenderActivityId(filter.criteria.tenderActivityId || 'all');
    setTenderAreasId(filter.criteria.tenderAreasId || 'all');
    setKeywords(filter.criteria.keywords || '');
    
    // Switch to search tab and trigger search
    setActiveTab('search');
    setPage(1);
    
    // Create a temporary object to capture current state after updates
    const updatedFilter = {
      agencyName: filter.criteria.agencyName || '',
      tenderActivityId: filter.criteria.tenderActivityId || 'all',
      tenderAreasId: filter.criteria.tenderAreasId || 'all',
      keywords: filter.criteria.keywords || ''
    };
    
    // Update last run time for this filter
    updateFilterLastRun(filter.id);
    
    // Use setTimeout to ensure state updates before fetching
    setTimeout(() => {
      // Manually construct and execute the search with the filter criteria
      const queryParams = new URLSearchParams();
      if (updatedFilter.agencyName) queryParams.append('agencyName', updatedFilter.agencyName);
      if (updatedFilter.tenderActivityId && updatedFilter.tenderActivityId !== 'all') {
        queryParams.append('tenderActivityId', updatedFilter.tenderActivityId);
      }
      if (updatedFilter.tenderAreasId && updatedFilter.tenderAreasId !== 'all') {
        queryParams.append('tenderAreasId', updatedFilter.tenderAreasId);
      }
      if (updatedFilter.keywords) queryParams.append('keywords', updatedFilter.keywords);
      queryParams.append('page', '1');
      queryParams.append('limit', limit.toString());
      
      // Call fetch directly with the constructed params
      setLoading(true);
      setError(null);
      
      fetch(`/api/tenders?${queryParams.toString()}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error fetching tenders: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          setTenders(data.results || []);
          setTotalResults(data.total || 0);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 100);
  };
  
  // Helper function to update lastRun time for a filter
  const updateFilterLastRun = async (filterId: string) => {
    try {
      // Find the filter in our local state
      const filterIndex = savedFilters.findIndex(f => f.id === filterId);
      if (filterIndex === -1) return;
      
      // Update the lastRun time and count in our local state
      const updatedFilters = [...savedFilters];
      updatedFilters[filterIndex] = {
        ...updatedFilters[filterIndex],
        lastRun: new Date().toISOString()
      };
      
      setSavedFilters(updatedFilters);
      
      // We could also send a PATCH request to update this on the server
      // but for now we'll just update it locally
    } catch (err) {
      console.error('Error updating filter last run time:', err);
    }
  };

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your filter",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Prepare the filter criteria
      const criteria = {
        agencyName: agencyName || undefined,
        tenderActivityId: tenderActivityId !== 'all' ? tenderActivityId : undefined,
        tenderAreasId: tenderAreasId !== 'all' ? tenderAreasId : undefined,
        keywords: keywords || undefined
      };
      
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: saveFilterName,
          criteria,
          count: totalResults
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save filter');
      }
      
      const savedFilter = await response.json();
      
      // Add the new filter to the list
      setSavedFilters(prev => [savedFilter, ...prev]);
      
      // Close the dialog and reset the name
      setSaveFilterDialogOpen(false);
      setSaveFilterName('');
      
      toast({
        title: "Success",
        description: "Filter saved successfully",
      });
    } catch (err) {
      console.error('Error saving filter:', err);
      toast({
        title: "Error",
        description: "Failed to save filter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const response = await fetch(`/api/filters?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete filter');
      }
      
      // Remove the filter from the list
      setSavedFilters(prev => prev.filter(filter => filter.id !== id));
      
      toast({
        title: "Success",
        description: "Filter deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting filter:', err);
      toast({
        title: "Error",
        description: "Failed to delete filter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActivityName = (activityId: string) => {
    const id = parseInt(activityId);
    if (isNaN(id)) return activityId;
    
    return VALID_TENDER_ACTIVITY_IDS[id as keyof typeof VALID_TENDER_ACTIVITY_IDS] || activityId;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Browse Tenders</h2>
        <p className="text-muted-foreground">
          Search and filter tenders from the database
        </p>
      </div>
      
      <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="saved-filters">
            Saved Filters 
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">{savedFilters.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Search Filters</CardTitle>
                  <CardDescription>Refine your search with these filters</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => setSaveFilterDialogOpen(true)}
                >
                  <Save className="h-4 w-4" />
                  Save Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    placeholder="Enter agency name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tenderActivityId">Activity</Label>
                  <Select 
                    value={tenderActivityId} 
                    onValueChange={setTenderActivityId}
                  >
                    <SelectTrigger id="tenderActivityId">
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      
                      {/* Only show main categories (1-19) */}
                      {Object.entries(VALID_TENDER_ACTIVITY_IDS)
                        .filter(([id]) => parseInt(id) < 20) // Only main categories
                        .map(([id, name]) => (
                          <SelectItem 
                            key={`main-${id}`} 
                            value={id}
                          >
                            {name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tenderAreasId">Area</Label>
                  <Select 
                    value={tenderAreasId} 
                    onValueChange={setTenderAreasId}
                  >
                    <SelectTrigger id="tenderAreasId">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {Object.entries(VALID_TENDER_AREA_IDS).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="Enter keywords (e.g. construction, supplies, services)"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
                
                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-500 mt-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4 mt-6">
            <h3 className="text-xl font-semibold">Results ({totalResults})</h3>
            
            {loading ? (
              <div className="text-center py-8">Loading tenders...</div>
            ) : tenders.length > 0 ? (
              <div className="space-y-4">
                {tenders.map((tender) => (
                  <Card key={tender.tenderId} className="hover:bg-gray-50">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{tender.tenderName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tender Number:</span> {tender.tenderNumber}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Agency:</span> {tender.agencyName}
                          </div>
                          {tender.tenderStatusName && (
                            <div>
                              <span className="text-muted-foreground">Status:</span> {tender.tenderStatusName}
                            </div>
                          )}
                          {tender.lastOfferPresentationDate && (
                            <div>
                              <span className="text-muted-foreground">Deadline:</span> {new Date(tender.lastOfferPresentationDate).toLocaleDateString()}
                            </div>
                          )}
                          {tender.tenderActivityName && (
                            <div>
                              <span className="text-muted-foreground">Activity:</span> {tender.tenderActivityName}
                            </div>
                          )}
                          {tender.branchName && (
                            <div>
                              <span className="text-muted-foreground">Area:</span> {tender.branchName}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex justify-between items-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevPage} 
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div>
                    Page {page} of {Math.ceil(totalResults / limit)}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleNextPage} 
                    disabled={page * limit >= totalResults}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No tenders found. Try adjusting your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="saved-filters">
          <Card>
            <CardHeader>
              <CardTitle>Your Saved Filters</CardTitle>
              <CardDescription>
                Apply saved filters to quickly search for tenders that match your interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFilters ? (
                <div className="text-center py-8">Loading saved filters...</div>
              ) : savedFilters.length > 0 ? (
                <div className="space-y-4">
                  {savedFilters.map((filter) => (
                    <Card key={filter.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bookmark className="h-4 w-4 text-blue-500" />
                          <h3 className="font-medium">{filter.name}</h3>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3">
                          {filter.criteria.agencyName && (
                            <Badge variant="outline" className="mr-2 mb-1">
                              Agency: {filter.criteria.agencyName}
                            </Badge>
                          )}
                          {filter.criteria.tenderActivityId && (
                            <Badge variant="outline" className="mr-2 mb-1">
                              Activity: {getActivityName(filter.criteria.tenderActivityId)}
                            </Badge>
                          )}
                          {filter.criteria.tenderAreasId && (
                            <Badge variant="outline" className="mr-2 mb-1">
                              Area: {filter.criteria.tenderAreasId}
                            </Badge>
                          )}
                          {filter.criteria.keywords && (
                            <Badge variant="outline" className="mr-2 mb-1">
                              Keywords: {filter.criteria.keywords}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {filter.count} tenders
                          </span>
                          <div className="space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApplyFilter(filter)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Apply
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteFilter(filter.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't saved any filters yet. Use the search tab to create and save filters.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Filter Dialog */}
      <Dialog open={saveFilterDialogOpen} onOpenChange={setSaveFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search Filter</DialogTitle>
            <DialogDescription>
              Give your filter a name to save your current search criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="filterName">Filter Name</Label>
            <Input
              id="filterName"
              placeholder="e.g., IT Services in Riyadh"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 