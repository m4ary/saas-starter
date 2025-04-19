import { Client } from '@elastic/elasticsearch';

// Create Elasticsearch client instance
const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH_REQUIRED === 'true' 
    ? {
        username: process.env.ELASTICSEARCH_USERNAME || '',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
      }
    : undefined,
  tls: process.env.ELASTICSEARCH_SSL_REQUIRED === 'true'
    ? {
        rejectUnauthorized: process.env.ELASTICSEARCH_VERIFY_SSL === 'true'
      }
    : undefined
});

// Verify connection on startup
async function checkConnection() {
  try {
    const info = await elasticClient.info();
    console.log(`Connected to Elasticsearch cluster: ${info.cluster_name}`);
    return true;
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    return false;
  }
}

// Check for index and create if it doesn't exist
async function ensureIndex(indexName: string) {
  try {
    const exists = await elasticClient.indices.exists({ index: indexName });
    
    if (!exists) {
      console.log(`Creating Elasticsearch index: ${indexName}`);
      await elasticClient.indices.create({
        index: indexName,
        mappings: {
          properties: {
            tenderId: { type: 'long' },
            tenderIdString: { type: 'keyword' },
            referenceNumber: { type: 'keyword' },
            tenderName: { type: 'text' },
            title: { type: 'text' },
            agencyName: { type: 'keyword' },
            organization: { type: 'keyword' },
            branchName: { type: 'keyword' },
            location: { type: 'keyword' },
            tenderStatusId: { type: 'integer' },
            tenderStatusName: { type: 'keyword' },
            status: { type: 'keyword' },
            tenderActivityId: { type: 'integer' },
            tenderActivityName: { type: 'keyword' },
            category: { type: 'keyword' },
            lastOfferPresentationDate: { type: 'date' },
            closingDate: { type: 'date' },
            remainingDays: { type: 'integer' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            added_date: { type: 'date' }
          }
        }
      });
      return true;
    }
    
    console.log(`Elasticsearch index exists: ${indexName}`);
    return true;
  } catch (error) {
    console.error(`Error ensuring index ${indexName}:`, error);
    return false;
  }
}

// Initialize Elasticsearch on startup, only in development
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  checkConnection()
    .then(() => {
      const tendersIndex = process.env.ELASTICSEARCH_TENDERS_INDEX || 'tenders';
      return ensureIndex(tendersIndex);
    })
    .catch(error => {
      console.error('Elasticsearch initialization error:', error);
    });
}

export default elasticClient; 