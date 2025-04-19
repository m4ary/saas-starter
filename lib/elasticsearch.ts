import { Client } from '@elastic/elasticsearch';

// Initialize Elasticsearch client
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

let esClient: Client | null = null;

export function getElasticsearchClient() {
  if (!esClient) {
    esClient = new Client({
      node: ELASTICSEARCH_URL,
    });
  }
  return esClient;
} 