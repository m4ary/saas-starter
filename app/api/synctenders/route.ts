import { NextRequest, NextResponse } from 'next/server';
import { getElasticsearchClient } from '@/lib/elasticsearch';
import { db } from '@/lib/db/drizzle';
import { syncLogs } from '@/lib/db/schema';

// Constants
const EXTERNAL_API_URL = "https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync";
const CUSTOM_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  "Accept": "*/*",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  "Sec-Fetch-Mode": "cors"
};

// Valid tender area IDs
const VALID_TENDER_AREA_IDS = {
  1: "منطقة الرياض",
  2: "منطقة مكة المكرمة",
  3: "منطقة المدينة المنورة ",
  4: "منطقة القصيم ",
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

// Valid tender activity IDs
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
  19: "الخدمات الأخرى"
};

// Valid tender categories
const VALID_TENDER_CATEGORIES = [2, 8];

// Default fields
const DEFAULT_FIELDS: string[] = ["tenderId", "tenderName", "tenderNumber", "agencyName", "tenderIdString"];

// Helper functions
function buildElasticsearchDoc(tender: any) {
  return {
    tenderId: tender.tenderId,
    referenceNumber: tender.referenceNumber,
    tenderName: tender.tenderName,
    tenderIdString: tender.tenderIdString,
    tenderNumber: tender.tenderNumber,
    agencyName: tender.agencyName,
    branchName: tender.branchName,
    tenderStatusId: tender.tenderStatusId,
    tenderStatusIdString: tender.tenderStatusIdString,
    tenderStatusName: tender.tenderStatusName,
    tenderTypeId: tender.tenderTypeId,
    tenderTypeName: tender.tenderTypeName,
    technicalOrganizationId: tender.technicalOrganizationId,
    condetionalBookletPrice: tender.condetionalBookletPrice,
    lastEnqueriesDate: tender.lastEnqueriesDate,
    lastOfferPresentationDate: tender.lastOfferPresentationDate,
    offersOpeningDate: tender.offersOpeningDate,
    lastEnqueriesDateHijri: tender.lastEnqueriesDateHijri,
    offersOpeningDateHijri: tender.offersOpeningDateHijri,
    lastOfferPresentationDateHijri: tender.lastOfferPresentationDateHijri,
    insideKSA: tender.insideKSA,
    tenderActivityName: tender.tenderActivityName,
    tenderActivityId: tender.tenderActivityId,
    submitionDate: tender.submitionDate,
    financialFees: tender.financialFees,
    invitationCost: tender.invitationCost,
    buyingCost: tender.buyingCost,
    hasInvitations: tender.hasInvitations,
    remainingDays: tender.remainingDays,
    remainingHours: tender.remainingHours,
    remainingMins: tender.remainingMins,
    currentDate: tender.currentDate,
    currentDateTime: tender.currentDateTime,
    currentTime: tender.currentTime,
    added_date: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fieldsParam = searchParams.get('fields');
  
  // Get other query parameters
  const tenderActivityId = searchParams.get('TenderActivityId') ? 
    parseInt(searchParams.get('TenderActivityId') as string) : undefined;
  const pageSize = searchParams.get('PageSize') ? 
    parseInt(searchParams.get('PageSize') as string) : undefined;
  const tenderCategory = searchParams.get('TenderCategory') ? 
    parseInt(searchParams.get('TenderCategory') as string) : undefined;
  const tenderAreasIdString = searchParams.get('TenderAreasIdString') ? 
    parseInt(searchParams.get('TenderAreasIdString') as string) : undefined;

  // Build query parameters for external API
  const queryParams = new URLSearchParams();
  if (tenderActivityId !== undefined) {
    queryParams.append('TenderActivityId', tenderActivityId.toString());
  }
  if (pageSize !== undefined) {
    queryParams.append('PageSize', pageSize.toString());
  }
  if (tenderCategory !== undefined) {
    queryParams.append('TenderCategory', tenderCategory.toString());
  }
  if (tenderAreasIdString !== undefined) {
    queryParams.append('TenderAreasIdString', tenderAreasIdString.toString());
  }

  // Copy any other parameters that might be present
  for (const [key, value] of Array.from(searchParams.entries())) {
    if (!['fields', 'TenderActivityId', 'PageSize', 'TenderCategory', 'TenderAreasIdString'].includes(key)) {
      queryParams.append(key, value);
    }
  }

  try {
    // Make the external API request
    const externalUrl = `${EXTERNAL_API_URL}?${queryParams.toString()}`;
    const externalResponse = await fetch(externalUrl, {
      headers: CUSTOM_HEADERS,
      next: { revalidate: 600 } // Cache for 10 minutes
    });

    if (!externalResponse.ok) {
      throw new Error(`External API returned ${externalResponse.status}: ${externalResponse.statusText}`);
    }

    const data = await externalResponse.json();
    const tenders = data.data || [];
    const selectedFields = fieldsParam ? 
      fieldsParam.split(',').map(f => f.trim()) : 
      DEFAULT_FIELDS;

    // Process tenders for Elasticsearch
    const newTenders = [];
    const seenIds = new Set<string>();
    
    for (const tender of tenders) {
      const tenderId = String(tender.tenderId);
      if (!seenIds.has(tenderId)) {
        newTenders.push(tender);
        seenIds.add(tenderId);
      }
    }

    // Index to Elasticsearch
    const es = getElasticsearchClient();
    for (const tender of newTenders) {
      const doc = buildElasticsearchDoc(tender);
      await es.index({
        index: 'tenders',
        id: String(tender.tenderId),
        document: doc,
      });
    }

    // Log the sync operation
    await db.insert(syncLogs).values({
      totalTenders: tenders.length,
      newTendersCount: newTenders.length
    });

    return NextResponse.json({
      message: "Sync completed",
      total_tenders: tenders.length,
      new_tenders_count: newTenders.length
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 