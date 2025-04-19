'use server';

// Import from the client module (which doesn't have 'use server')
import elasticClient from '@/lib/elasticsearch/client';
import { SyncSettings } from '@/lib/utils';

// This file contains server-only functions that can be exported
// from a server component or action

// Index name for tenders in Elasticsearch
const TENDERS_INDEX = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';

// Get dashboard statistics
export async function getTenderStats() {
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
export async function getRecentTenders(limit = 4) {
  try {
    const indexName = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';
    
    const response = await elasticClient.search({
      index: indexName,
      size: limit,
      sort: [
        { added_date: { order: 'desc' } }
      ]
    });
    
    // Transform Elasticsearch hits to tender objects
    const tenders = response.hits.hits.map((hit: any) => {
      const source = hit._source;
      
      // Map the API tender format to our internal format
      return {
        id: source.tenderId || source._id,
        tenderId: source.tenderId,
        tenderIdString: source.tenderIdString,
        title: source.tenderName || source.title,
        tenderName: source.tenderName,
        referenceNumber: source.referenceNumber,
        status: source.tenderStatusName || source.status || getStatusName(source.tenderStatusId),
        tenderStatusId: source.tenderStatusId,
        tenderStatusName: source.tenderStatusName,
        category: source.tenderActivityName || source.category || 'Unknown',
        tenderActivityName: source.tenderActivityName,
        tenderActivityId: source.tenderActivityId,
        organization: source.agencyName || source.organization || 'Unknown',
        agencyName: source.agencyName,
        branchName: source.branchName,
        closingDate: source.lastOfferPresentationDate,
        remainingDays: source.remainingDays,
        remainingHours: source.remainingHours,
        tenderTypeId: source.tenderTypeId,
        tenderTypeName: source.tenderTypeName,
        submitionDate: source.submitionDate,
        createdAt: source.added_date || source.submitionDate,
        updatedAt: source.added_date
      };
    });
    
    return tenders;
  } catch (error) {
    console.error('Error getting recent tenders from Elasticsearch:', error);
    // Fall back to mock data
    return getMockTenders().slice(0, limit);
  }
}

// Function to handle sync operations
export async function syncTenders(settings?: SyncSettings) {
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

// Get saved filters
export async function getSavedFilters(userId: string) {
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

// Helper function to get status name from status ID
function getStatusName(statusId?: number): string {
  if (!statusId) return 'Unknown';
  
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

// Helper function to get mock tenders for fallback
function getMockTenders() {
  return [
    {
      id: 931873,
      tenderId: 931873,
      referenceNumber: "250439009312",
      title: "تأمين اعاشة للمشاركين من قيادة حرس الحدود بمنطقة الحدود الشمالية في مشروع الرماية التعويدية لعام ١٤٤٦",
      tenderName: "تأمين اعاشة للمشاركين من قيادة حرس الحدود بمنطقة الحدود الشمالية في مشروع الرماية التعويدية لعام ١٤٤٦",
      organization: "حرس الحدود",
      agencyName: "حرس الحدود",
      branchName: "قيادة حرس الحدود بمنطقة الحدود الشمالية",
      status: "Open",
      tenderStatusId: 4,
      tenderStatusName: "Open",
      category: "تجارة المواد الغذائية",
      tenderActivityName: "تجارة المواد الغذائية",
      tenderActivityId: 101,
      closingDate: "2025-04-21T09:59:00",
      remainingDays: 3,
      createdAt: "2025-04-17T19:30:39.581401"
    },
    {
      id: 930180,
      tenderId: 930180,
      referenceNumber: "250439006901",
      title: "منافسة توريد قبضات حفر الأسنان عالية ومنخفضه السرعة في كلية طب الأسنان في جامعه الملك سعود بن عبدالعزيز للعلوم الصحية",
      tenderName: "منافسة توريد قبضات حفر الأسنان عالية ومنخفضه السرعة في كلية طب الأسنان في جامعه الملك سعود بن عبدالعزيز للعلوم الصحية",
      organization: "جامعة الملك سعود بن عبد العزیز للعلوم الصحیة",
      agencyName: "جامعة الملك سعود بن عبد العزیز للعلوم الصحیة",
      branchName: "ادارة التموين والعقود بجامعة الملك سعود بن عبدالعزيز للعلوم الصحية بالرياض",
      status: "Open",
      tenderStatusId: 4,
      tenderStatusName: "Open",
      category: "مستودعات الادوية والصيدليات - المستلزمات الطبية",
      tenderActivityName: "مستودعات الادوية والصيدليات - المستلزمات الطبية",
      tenderActivityId: 119,
      closingDate: "2025-05-05T09:59:00",
      remainingDays: 17,
      createdAt: "2025-04-17T19:30:39.585259"
    },
    {
      id: 878098,
      tenderId: 878098,
      referenceNumber: "241239001737",
      title: "توريد عدد (4) محركات من نوع (MTU) للسفن بعيدة المدى (OPS) فئة 40م لعموم المناطق البحرية",
      tenderName: "توريد عدد (4) محركات من نوع (MTU) للسفن بعيدة المدى (OPS) فئة 40م لعموم المناطق البحرية",
      organization: "حرس الحدود",
      agencyName: "حرس الحدود",
      branchName: "ادارة المشتريات والعقود",
      status: "Open",
      tenderStatusId: 4,
      tenderStatusName: "Open",
      category: "تجارة قطع الغيار الجديدة",
      tenderActivityName: "تجارة قطع الغيار الجديدة",
      tenderActivityId: 111,
      closingDate: "2025-05-18T09:59:00",
      remainingDays: 30,
      createdAt: "2025-04-17T19:30:39.592562"
    },
    {
      id: 931735,
      tenderId: 931735,
      referenceNumber: "250439009065",
      title: "توريد قطع غيار لسفن جلالة الملك",
      tenderName: "توريد قطع غيار لسفن جلالة الملك",
      organization: "القوات البحرية",
      agencyName: "القوات البحرية",
      branchName: "مركز التموين البحري بالاسطول الشرقي",
      status: "Open",
      tenderStatusId: 4,
      tenderStatusName: "Open",
      category: "تجارة قطع الغيار الجديدة",
      tenderActivityName: "تجارة قطع الغيار الجديدة",
      tenderActivityId: 111,
      closingDate: "2025-04-21T09:59:00",
      remainingDays: 3,
      createdAt: "2025-04-17T19:30:39.598448"
    }
  ];
} 