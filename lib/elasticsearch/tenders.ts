'use server';

import elasticClient from './client';
import { SyncSettings } from '@/lib/utils';

// Re-export the SyncSettings type
export type { SyncSettings };

// Index name for tenders in Elasticsearch
const TENDERS_INDEX = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';

// Types for the tender data
export interface Tender {
  id: string | number;
  tenderId?: number;
  tenderIdString?: string;
  referenceNumber?: string;
  title: string;
  tenderName?: string;
  description?: string;
  publishDate?: string;
  closingDate?: string;
  lastOfferPresentationDate?: string;
  status: string;
  tenderStatusId?: number;
  tenderStatusName?: string;
  category: string;
  tenderTypeName?: string;
  tenderTypeId?: number;
  tenderActivityName?: string;
  tenderActivityId?: number;
  organization: string;
  agencyName?: string;
  branchName?: string;
  value?: number;
  remainingDays?: number;
  remainingHours?: number;
  currency?: string;
  location?: string;
  tags?: string[];
  documentUrl?: string;
  createdAt?: string;
  submitionDate?: string;
  updatedAt?: string;
  added_date?: string;
}

export interface TendersSearchResult {
  tenders: Tender[];
  total: number;
  page: number;
  limit: number;
}

export interface TendersStats {
  totalTenders: number;
  newTodayCount: number;
  byStatus: { [key: string]: number };
  byCategory: { [key: string]: number };
}

export interface SavedFilter {
  id: string;
  name: string;
  criteria: string;
  userId: string;
  lastRun: string;
  count: number;
}

/**
 * Convert API tender format to our internal Tender format
 */
function mapApiTenderToTender(apiTender: any): Tender {
  return {
    id: apiTender.tenderId || apiTender.id,
    tenderId: apiTender.tenderId,
    tenderIdString: apiTender.tenderIdString,
    title: apiTender.tenderName || apiTender.title,
    tenderName: apiTender.tenderName,
    referenceNumber: apiTender.referenceNumber,
    status: getTenderStatusName(apiTender.tenderStatusId),
    tenderStatusId: apiTender.tenderStatusId,
    tenderStatusName: apiTender.tenderStatusName,
    category: apiTender.tenderActivityName || apiTender.category || 'Unknown',
    tenderActivityName: apiTender.tenderActivityName,
    tenderActivityId: apiTender.tenderActivityId,
    organization: apiTender.agencyName || apiTender.organization || 'Unknown',
    agencyName: apiTender.agencyName,
    branchName: apiTender.branchName,
    closingDate: apiTender.lastOfferPresentationDate,
    remainingDays: apiTender.remainingDays,
    remainingHours: apiTender.remainingHours,
    tenderTypeId: apiTender.tenderTypeId,
    tenderTypeName: apiTender.tenderTypeName,
    submitionDate: apiTender.submitionDate,
    createdAt: apiTender.added_date || apiTender.submitionDate,
    updatedAt: apiTender.added_date
  };
}

/**
 * Get tender status name based on status ID
 */
function getTenderStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: 'Draft',
    2: 'Pending',
    3: 'Under Review',
    4: 'Open',
    5: 'Closed',
    6: 'Awarded',
    7: 'Canceled'
  };
  
  return statusMap[statusId] || 'Unknown';
}

// Get dashboard statistics
export async function getTenderStats(): Promise<TendersStats> {
  try {
    const indexName = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';
    
    // Get total tenders count
    const countResult = await elasticClient.count({
      index: indexName
    });
    
    // Get new tenders count (added in the last 24 hours)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const newTodayResult = await elasticClient.count({
      index: indexName,
      query: {
        range: {
          added_date: {
            gte: yesterday.toISOString()
          }
        }
      }
    });
    
    // Get count by status
    const statusAggResult = await elasticClient.search({
      index: indexName,
      size: 0,
      aggs: {
        status_counts: {
          terms: {
            field: 'status',
            size: 10
          }
        }
      }
    });
    
    // Get count by category
    const categoryAggResult = await elasticClient.search({
      index: indexName,
      size: 0,
      aggs: {
        category_counts: {
          terms: {
            field: 'category',
            size: 10
          }
        }
      }
    });
    
    // Process aggregation results
    const statusBuckets = (statusAggResult.aggregations as any)?.status_counts?.buckets || [];
    const categoryBuckets = (categoryAggResult.aggregations as any)?.category_counts?.buckets || [];
    
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    statusBuckets.forEach((bucket: any) => {
      byStatus[bucket.key] = bucket.doc_count;
    });
    
    categoryBuckets.forEach((bucket: any) => {
      byCategory[bucket.key] = bucket.doc_count;
    });
    
    return {
      totalTenders: countResult.count,
      newTodayCount: newTodayResult.count,
      byStatus,
      byCategory
    };
  } catch (error) {
    console.error('Error getting tender stats from Elasticsearch:', error);
    // Fall back to mock data in case of error
    return {
      totalTenders: 3217,
      newTodayCount: 42,
      byStatus: {
        'Open': 56,
        'Closed': 22,
        'Awarded': 15,
        'Pending': 8
      },
      byCategory: {
        'تجارة مواد البناء والأدوات الكهربائية والصحية': 24,
        'تجارة قطع الغيار الجديدة': 18,
        'تجارة المواد الغذائية': 12,
        'تجارة الكماليات': 10,
        'مستودعات الادوية والصيدليات - المستلزمات الطبية': 8
      }
    };
  }
}

// Get recent tenders from Elasticsearch
export async function getRecentTenders(limit = 4): Promise<Tender[]> {
  try {
    const indexName = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';
    
    const response = await elasticClient.search({
      index: indexName,
      size: limit,
      sort: [
        { added_date: { order: 'desc' } }
      ]
    });
    
    // Transform Elasticsearch hits to Tender objects
    const tenders: Tender[] = response.hits.hits.map((hit: any) => {
      const source = hit._source;
      return mapApiTenderToTender(source);
    });
    
    return tenders;
  } catch (error) {
    console.error('Error getting recent tenders from Elasticsearch:', error);
    // Fall back to mock data in case of error
    const mockResponse = {
      "results": [
        {
          "tenderId": 931873,
          "referenceNumber": "250439009312",
          "tenderName": "تأمين اعاشة للمشاركين من قيادة حرس الحدود بمنطقة الحدود الشمالية في مشروع الرماية التعويدية لعام ١٤٤٦",
          "tenderIdString": "NftZRMwBVUdOaeB5Jlhhrw==",
          "tenderNumber": null,
          "agencyName": "حرس الحدود",
          "branchName": "قيادة حرس الحدود بمنطقة الحدود الشمالية",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 2,
          "tenderTypeName": "شراء مباشر",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 0,
          "lastEnqueriesDate": "2025-04-19T17:35:13.1276361",
          "lastOfferPresentationDate": "2025-04-21T09:59:00",
          "offersOpeningDate": null,
          "lastEnqueriesDateHijri": "1446-10-21",
          "offersOpeningDateHijri": "",
          "lastOfferPresentationDateHijri": "1446-10-23",
          "insideKSA": null,
          "tenderActivityName": "تجارة المواد الغذائية",
          "tenderActivityId": 101,
          "submitionDate": "2025-04-17T17:35:13.1276412",
          "financialFees": 0,
          "invitationCost": 200,
          "buyingCost": 0,
          "hasInvitations": false,
          "remainingDays": 3,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.1991836+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.581401"
        },
        {
          "tenderId": 930180,
          "referenceNumber": "250439006901",
          "tenderName": "منافسة توريد قبضات حفر الأسنان عالية ومنخفضه السرعة في كلية طب الأسنان في جامعه الملك سعود بن عبدالعزيز للعلوم الصحية في الرياض ذات الإعلان رقم كاساو/2025/022",
          "tenderIdString": "LsYKbcHm9HyosDXJHjgQrg==",
          "tenderNumber": "كاساو/2025/022",
          "agencyName": "جامعة الملك سعود بن عبد العزیز للعلوم الصحیة",
          "branchName": "ادارة التموين والعقود بجامعة الملك سعود بن عبدالعزيز  للعلوم الصحية بالرياض",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 1,
          "tenderTypeName": "منافسة عامة",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 200,
          "lastEnqueriesDate": "2025-04-27T16:46:03.5785977",
          "lastOfferPresentationDate": "2025-05-05T09:59:00",
          "offersOpeningDate": "2025-05-05T10:00:00",
          "lastEnqueriesDateHijri": "1446-10-29",
          "offersOpeningDateHijri": "1446-11-07",
          "lastOfferPresentationDateHijri": "1446-11-07",
          "insideKSA": null,
          "tenderActivityName": "\tمستودعات الادوية والصيدليات - المستلزمات الطبية",
          "tenderActivityId": 119,
          "submitionDate": "2025-04-17T16:46:03.5787341",
          "financialFees": 500,
          "invitationCost": 200,
          "buyingCost": 500,
          "hasInvitations": false,
          "remainingDays": 17,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.199187+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.585259"
        },
        {
          "tenderId": 878098,
          "referenceNumber": "241239001737",
          "tenderName": "توريد عدد (4) محركات من نوع  (MTU) للسفن بعيدة المدى (OPS) فئة 40م  لعموم المناطق البحرية",
          "tenderIdString": "vrdseeqOprurHqbPGeiPDA==",
          "tenderNumber": "244/024",
          "agencyName": "حرس الحدود",
          "branchName": "ادارة المشتريات والعقود",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 1,
          "tenderTypeName": "منافسة عامة",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 300,
          "lastEnqueriesDate": "2025-04-27T16:41:01.0271495",
          "lastOfferPresentationDate": "2025-05-18T09:59:00",
          "offersOpeningDate": "2025-05-18T10:00:00",
          "lastEnqueriesDateHijri": "1446-10-29",
          "offersOpeningDateHijri": "1446-11-20",
          "lastOfferPresentationDateHijri": "1446-11-20",
          "insideKSA": null,
          "tenderActivityName": "تجارة قطع الغيار الجديدة ",
          "tenderActivityId": 111,
          "submitionDate": "2025-04-17T16:41:01.0272055",
          "financialFees": 500,
          "invitationCost": 200,
          "buyingCost": 500,
          "hasInvitations": false,
          "remainingDays": 30,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.1991904+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.592562"
        },
        {
          "tenderId": 931735,
          "referenceNumber": "250439009065",
          "tenderName": "توريد قطع غيار لسفن جلالة الملك ",
          "tenderIdString": "VZ*@@**Hkw4UyWCp5ibK1hnD4A==",
          "tenderNumber": "6-110824",
          "agencyName": "القوات البحرية",
          "branchName": "مركز التموين البحري بالاسطول الشرقي",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 2,
          "tenderTypeName": "شراء مباشر",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 0,
          "lastEnqueriesDate": "2025-04-19T16:36:46.417983",
          "lastOfferPresentationDate": "2025-04-21T09:59:00",
          "offersOpeningDate": null,
          "lastEnqueriesDateHijri": "1446-10-21",
          "offersOpeningDateHijri": "",
          "lastOfferPresentationDateHijri": "1446-10-23",
          "insideKSA": null,
          "tenderActivityName": "تجارة قطع الغيار الجديدة ",
          "tenderActivityId": 111,
          "submitionDate": "2025-04-17T16:36:46.4179881",
          "financialFees": 0,
          "invitationCost": 200,
          "buyingCost": 0,
          "hasInvitations": false,
          "remainingDays": 3,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.1991938+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.598448"
        }
      ]
    };
    
    return mockResponse.results.slice(0, limit).map(mapApiTenderToTender);
  }
}

// Search tenders with pagination
export async function searchTenders(
  query: string = '', 
  filters: Record<string, any> = {}, 
  page = 1, 
  limit = 10
): Promise<TendersSearchResult> {
  try {
    // In a real implementation, we'd query Elasticsearch
    // For now, we'll use the provided sample data
    
    // This is mock data based on the sample provided
    const mockResponse = {
      "results": [
        {
          "tenderId": 931873,
          "referenceNumber": "250439009312",
          "tenderName": "تأمين اعاشة للمشاركين من قيادة حرس الحدود بمنطقة الحدود الشمالية في مشروع الرماية التعويدية لعام ١٤٤٦",
          "tenderIdString": "NftZRMwBVUdOaeB5Jlhhrw==",
          "tenderNumber": null,
          "agencyName": "حرس الحدود",
          "branchName": "قيادة حرس الحدود بمنطقة الحدود الشمالية",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 2,
          "tenderTypeName": "شراء مباشر",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 0,
          "lastEnqueriesDate": "2025-04-19T17:35:13.1276361",
          "lastOfferPresentationDate": "2025-04-21T09:59:00",
          "offersOpeningDate": null,
          "lastEnqueriesDateHijri": "1446-10-21",
          "offersOpeningDateHijri": "",
          "lastOfferPresentationDateHijri": "1446-10-23",
          "insideKSA": null,
          "tenderActivityName": "تجارة المواد الغذائية",
          "tenderActivityId": 101,
          "submitionDate": "2025-04-17T17:35:13.1276412",
          "financialFees": 0,
          "invitationCost": 200,
          "buyingCost": 0,
          "hasInvitations": false,
          "remainingDays": 3,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.1991836+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.581401"
        },
        {
          "tenderId": 930180,
          "referenceNumber": "250439006901",
          "tenderName": "منافسة توريد قبضات حفر الأسنان عالية ومنخفضه السرعة في كلية طب الأسنان في جامعه الملك سعود بن عبدالعزيز للعلوم الصحية في الرياض ذات الإعلان رقم كاساو/2025/022",
          "tenderIdString": "LsYKbcHm9HyosDXJHjgQrg==",
          "tenderNumber": "كاساو/2025/022",
          "agencyName": "جامعة الملك سعود بن عبد العزیز للعلوم الصحیة",
          "branchName": "ادارة التموين والعقود بجامعة الملك سعود بن عبدالعزيز  للعلوم الصحية بالرياض",
          "tenderStatusId": 4,
          "tenderStatusIdString": "6qPa1DWumsGG0KjPQhbCXA==",
          "tenderStatusName": null,
          "tenderTypeId": 1,
          "tenderTypeName": "منافسة عامة",
          "technicalOrganizationId": null,
          "condetionalBookletPrice": 200,
          "lastEnqueriesDate": "2025-04-27T16:46:03.5785977",
          "lastOfferPresentationDate": "2025-05-05T09:59:00",
          "offersOpeningDate": "2025-05-05T10:00:00",
          "lastEnqueriesDateHijri": "1446-10-29",
          "offersOpeningDateHijri": "1446-11-07",
          "lastOfferPresentationDateHijri": "1446-11-07",
          "insideKSA": null,
          "tenderActivityName": "\tمستودعات الادوية والصيدليات - المستلزمات الطبية",
          "tenderActivityId": 119,
          "submitionDate": "2025-04-17T16:46:03.5787341",
          "financialFees": 500,
          "invitationCost": 200,
          "buyingCost": 500,
          "hasInvitations": false,
          "remainingDays": 17,
          "remainingHours": 11,
          "remainingMins": 28,
          "currentDate": "2025-04-17T00:00:00+03:00",
          "currentDateTime": "2025-04-17T22:30:39.199187+03:00",
          "currentTime": "00:00:00",
          "added_date": "2025-04-17T19:30:39.585259"
        }
      ],
      "total": 56
    };
    
    const tenders = mockResponse.results.map(mapApiTenderToTender);
    const total = mockResponse.total;
    
    return {
      tenders,
      total,
      page,
      limit
    };
  } catch (error) {
    console.error('Error searching tenders:', error);
    return {
      tenders: [],
      total: 0,
      page,
      limit
    };
  }
}

// Get user's saved filters
export async function getSavedFilters(userId: string): Promise<SavedFilter[]> {
  // Mock data for saved filters
  const mockSavedFilters = [
    { 
      id: '1', 
      name: 'IT Services Tenders', 
      criteria: 'category:IT, keywords:"cloud, infrastructure, support"',
      userId,
      lastRun: new Date().toISOString(),
      count: 127
    },
    { 
      id: '2', 
      name: 'Medical Equipment', 
      criteria: 'category:Healthcare, keywords:"equipment, supplies, medical"',
      userId,
      lastRun: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      count: 89
    },
    { 
      id: '3', 
      name: 'Government Construction', 
      criteria: 'category:Construction, client:Government, budget:>1000000',
      userId,
      lastRun: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      count: 54
    }
  ];
  
  return mockSavedFilters;
}

// Function to handle sync operations
export async function syncTenders(settings?: {
  fields?: string | string[] | null;
  tenderActivityId?: number | null;
  pageSize?: number | null;
  tenderCategory?: number | null;
  tenderAreasIdString?: number | null;
}): Promise<{
  success: boolean;
  message: string;
  stats?: {
    total: number;
    added: number;
    updated: number;
    failed: number;
  };
}> {
  try {
    // Get the external API URL 
    const externalApiUrl = "https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync";
    const indexName = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';
    
    if (!externalApiUrl) {
      console.warn('External API URL is not defined');
      return {
        success: false,
        message: 'External API URL not configured'
      };
    }
    
    console.log(`Syncing with external API: ${externalApiUrl}`);
    console.log("Using sync settings:", settings);
    
    // Build query parameters from settings
    const queryParams = new URLSearchParams();
    
    if (settings?.pageSize) {
      queryParams.append('PageSize', settings.pageSize.toString());
    } else {
      // Default page size if not specified
      queryParams.append('PageSize', '50');
    }
    
    if (settings?.tenderCategory) {
      queryParams.append('TenderCategory', settings.tenderCategory.toString());
    }
    
    if (settings?.tenderActivityId) {
      queryParams.append('TenderActivityId', settings.tenderActivityId.toString());
    }
    
    if (settings?.tenderAreasIdString) {
      queryParams.append('TenderAreasIdString', settings.tenderAreasIdString.toString());
    }
    
    if (settings?.fields) {
      const fieldsValue = Array.isArray(settings.fields) 
        ? settings.fields.join(',') 
        : settings.fields;
      queryParams.append('fields', fieldsValue);
    }
    
    // Construct the final URL with query parameters
    const apiUrlWithParams = `${externalApiUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    // Make the actual API call
    console.log(`Fetching from: ${apiUrlWithParams}`);
    
    try {
      const response = await fetch(apiUrlWithParams, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      const tenders = data.results || [];
      
      console.log(`Retrieved ${tenders.length} tenders from API`);
      
      // Process tenders and index to Elasticsearch
      const stats = {
        total: tenders.length,
        added: 0,
        updated: 0,
        failed: 0
      };
      
      // Using bulk API for better performance
      const bulkBody = [];
      
      for (const tender of tenders) {
        // Prepare document ID
        const docId = tender.tenderId?.toString() || 
                       tender.tenderIdString ||
                       `${tender.referenceNumber}_${tender.tenderName?.substring(0, 20)}`;
        
        // Add metadata for document
        bulkBody.push({ 
          index: { 
            _index: indexName, 
            _id: docId 
          } 
        });
        
        // Add document data with timestamp
        const doc = {
          ...tender,
          added_date: new Date().toISOString(),
          source: 'api_sync'
        };
        
        bulkBody.push(doc);
      }
      
      if (bulkBody.length > 0) {
        // Execute bulk operation
        const bulkResponse = await elasticClient.bulk({
          refresh: true,
          body: bulkBody
        });
        
        // Process results
        if (bulkResponse.errors) {
          // Some documents failed
          bulkResponse.items.forEach(item => {
            if (item.index?.status && item.index.status >= 200 && item.index.status < 300) {
              if (item.index.result === 'created') {
                stats.added++;
              } else if (item.index.result === 'updated') {
                stats.updated++;
              }
            } else {
              stats.failed++;
              console.error('Indexing error:', item.index?.error);
            }
          });
        } else {
          // All documents succeeded
          bulkResponse.items.forEach(item => {
            if (item.index?.result === 'created') {
              stats.added++;
            } else if (item.index?.result === 'updated') {
              stats.updated++;
            }
          });
        }
      }
      
      return {
        success: true,
        message: `Sync completed: ${stats.added} added, ${stats.updated} updated, ${stats.failed} failed`,
        stats
      };
    } catch (apiError) {
      console.error('Error fetching from API:', apiError);
      return {
        success: false,
        message: `Error fetching from API: ${(apiError as Error).message}`
      };
    }
  } catch (error) {
    console.error('Error syncing tenders:', error);
    return {
      success: false,
      message: `Sync operation failed: ${(error as Error).message}`
    };
  }
} 