'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { signOutClient } from '@/lib/auth/client';

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

export default function BrowseTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [tenderActivityId, setTenderActivityId] = useState('all');
  const [tenderAreasId, setTenderAreasId] = useState('all');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10;

  const fetchTenders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (agencyName) queryParams.append('agencyName', agencyName);
      if (tenderActivityId && tenderActivityId !== 'all') queryParams.append('tenderActivityId', tenderActivityId);
      if (tenderAreasId && tenderAreasId !== 'all') queryParams.append('tenderAreasId', tenderAreasId);
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
    fetchTenders();
  }, [page]);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Browse Tenders</h2>
        <p className="text-muted-foreground">
          Search and filter tenders from the database
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Refine your search with these filters</CardDescription>
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
                  <SelectItem value="1">التجارة</SelectItem>
                  <SelectItem value="2">المقاولات</SelectItem>
                  <SelectItem value="3">التشغيل والصيانة</SelectItem>
                  <SelectItem value="9">الاتصالات وتقنية المعلومات</SelectItem>
                  {/* Add more options as needed */}
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
                  <SelectItem value="1">منطقة الرياض</SelectItem>
                  <SelectItem value="2">منطقة مكة المكرمة</SelectItem>
                  <SelectItem value="5">المنطقة الشرقية</SelectItem>
                  {/* Add more options as needed */}
                </SelectContent>
              </Select>
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
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
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
    </div>
  );
} 