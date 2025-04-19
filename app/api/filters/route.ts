import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

// Mock database for saved filters
let savedFilters: {
  id: string;
  name: string;
  userId: string;
  criteria: {
    agencyName?: string;
    tenderActivityId?: string;
    tenderAreasId?: string;
    keywords?: string;
  };
  lastRun: string;
  count: number;
}[] = [];

// GET /api/filters - Get all saved filters for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Filter by user ID
    const userFilters = savedFilters.filter(filter => filter.userId === String(user.id));
    
    return NextResponse.json(userFilters);
  } catch (error: any) {
    console.error('Error getting saved filters:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/filters - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.name || !data.criteria) {
      return NextResponse.json(
        { error: 'Name and criteria are required' },
        { status: 400 }
      );
    }
    
    // Create a new filter
    const newFilter = {
      id: crypto.randomUUID(),
      name: data.name,
      userId: String(user.id),
      criteria: data.criteria,
      lastRun: new Date().toISOString(),
      count: data.count || 0
    };
    
    // Add to our mock database
    savedFilters.push(newFilter);
    
    return NextResponse.json(newFilter, { status: 201 });
  } catch (error: any) {
    console.error('Error creating saved filter:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/filters/:id - Delete a saved filter
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract ID from query parameters
    const url = new URL(request.url);
    const filterId = url.searchParams.get('id');
    
    if (!filterId) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      );
    }
    
    // Check if filter exists and belongs to user
    const filterIndex = savedFilters.findIndex(
      filter => filter.id === filterId && filter.userId === String(user.id)
    );
    
    if (filterIndex === -1) {
      return NextResponse.json(
        { error: 'Filter not found or access denied' },
        { status: 404 }
      );
    }
    
    // Remove filter
    savedFilters.splice(filterIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting saved filter:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 