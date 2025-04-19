import { NextRequest, NextResponse } from 'next/server';
import { getElasticsearchClient } from '@/lib/elasticsearch';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agencyName = searchParams.get('agencyName');
  const tenderActivityId = searchParams.get('tenderActivityId') ? 
    parseInt(searchParams.get('tenderActivityId') as string) : undefined;
  const tenderAreasId = searchParams.get('tenderAreasId') ? 
    parseInt(searchParams.get('tenderAreasId') as string) : undefined;
  const limit = searchParams.get('limit') ? 
    parseInt(searchParams.get('limit') as string) : 50;
  const page = searchParams.get('page') ? 
    parseInt(searchParams.get('page') as string) : 1;

  const queryFilters = [];

  if (agencyName) {
    queryFilters.push({ match: { agencyName } });
  }
  if (tenderActivityId) {
    queryFilters.push({ match: { tenderActivityId } });
  }
  if (tenderAreasId) {
    queryFilters.push({ match: { branchName: tenderAreasId } });
  }

  const fromIndex = (page - 1) * limit;

  try {
    const es = getElasticsearchClient();
    const response = await es.search({
      index: 'tenders',
      from: fromIndex,
      size: limit,
      query: {
        bool: {
          must: queryFilters.length ? queryFilters : [{ match_all: {} }]
        }
      }
    });
    
    const hits = response.hits.hits;
    const results = hits.map(hit => hit._source);
    const total = typeof response.hits.total === 'number' 
      ? response.hits.total 
      : (response.hits.total?.value || 0);
    
    return NextResponse.json({ results, total });
  } catch (error: any) {
    console.error('Elasticsearch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 