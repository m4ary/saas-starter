import { NextRequest, NextResponse } from 'next/server';
import { getElasticsearchClient } from '@/lib/elasticsearch';

// Import valid activity IDs from the synctenders constants
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
  90: "خدمات الاتصالات",
  91: "تطوير البرمجيات",
  92: "خدمات تقنية المعلومات",
  93: "البنية التحتية للاتصالات",
  94: "أمن المعلومات",
  95: "الشبكات والاتصالات"
};

// Log the available tender activity IDs for debugging
console.log("Available VALID_TENDER_ACTIVITY_IDS:");
Object.entries(VALID_TENDER_ACTIVITY_IDS).forEach(([id, name]) => {
  console.log(`ID: ${id} - ${name}`);
});

// Helper function to get all related activity IDs by main category
function getRelatedActivityIds(activityId: number): number[] {
  // Convert to string for easier manipulation
  const activityIdStr = activityId.toString();
  
  console.log(`Finding related IDs for activityId: ${activityIdStr}`);
  
  // For any category ID (including single digits/main categories)
  // Simply return this ID and any ID that starts with this pattern
  const relatedIds = Object.keys(VALID_TENDER_ACTIVITY_IDS)
    .filter(id => {
      // Either exact match or starts with the activityId
      return id === activityIdStr || id.startsWith(activityIdStr);
    })
    .map(id => parseInt(id));
  
  // Special handling for known categories in the DB
  // These are the ones we know for sure exist in the data
  if (activityIdStr === "9") {
    // Ensure 901 and 902 are included for category 9
    if (!relatedIds.includes(901)) relatedIds.push(901);
    if (!relatedIds.includes(902)) relatedIds.push(902);
  }
  
  console.log(`For category ${activityId}, found related IDs: ${relatedIds.join(', ')}`);
  return relatedIds;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agencyName = searchParams.get('agencyName');
  const tenderActivityId = searchParams.get('tenderActivityId') ? 
    parseInt(searchParams.get('tenderActivityId') as string) : undefined;
  const tenderAreasId = searchParams.get('tenderAreasId') ? 
    parseInt(searchParams.get('tenderAreasId') as string) : undefined;
  const keywords = searchParams.get('keywords');
  const limit = searchParams.get('limit') ? 
    parseInt(searchParams.get('limit') as string) : 50;
  const page = searchParams.get('page') ? 
    parseInt(searchParams.get('page') as string) : 1;

  // Create a simpler query structure that works with the Elasticsearch client
  let esQuery: any = {
    bool: {
      must: []
    }
  };

  // Agency name filter
  if (agencyName && agencyName.trim()) {
    esQuery.bool.must.push({
      wildcard: {
        agencyName: `*${agencyName}*`
      }
    });
  }

  // Activity filter - supports hierarchical categories
  if (tenderActivityId) {
    // Get all related activity IDs for this activity
    const relatedIds = getRelatedActivityIds(tenderActivityId);
    
    // Use a terms query to match any of the related IDs
    esQuery.bool.must.push({
      terms: {
        tenderActivityId: relatedIds
      }
    });
  }

  // Area/region filter
  if (tenderAreasId) {
    // Try with a should clause
    const regionQuery = {
      bool: {
        should: [
          { term: { tenderAreasIdString: tenderAreasId.toString() } },
          { match_phrase: { branchName: tenderAreasId.toString() } }
        ],
        minimum_should_match: 1
      }
    };
    
    esQuery.bool.must.push(regionQuery);
  }

  // Keyword search
  if (keywords && keywords.trim()) {
    esQuery.bool.must.push({
      multi_match: {
        query: keywords,
        fields: ["tenderName^3", "agencyName^2", "tenderActivityName", "branchName", "referenceNumber"],
        // Use 'most_fields' which is a valid Elasticsearch option
        type: "most_fields",
        fuzziness: "AUTO"
      }
    });
  }

  // If no filters applied, match all documents
  if (esQuery.bool.must.length === 0) {
    esQuery = { match_all: {} };
  }

  const fromIndex = (page - 1) * limit;

  console.log('Elasticsearch query:', JSON.stringify(esQuery, null, 2));

  try {
    const es = getElasticsearchClient();
    const response = await es.search({
      index: 'tenders',
      from: fromIndex,
      size: limit,
      query: esQuery,
      sort: [
        { added_date: { order: 'desc' } }
      ]
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