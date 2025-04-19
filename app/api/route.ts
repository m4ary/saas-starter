import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Welcome to the Tenders API wrapper!",
    endpoints: {
      "/api/tenders": "Get filtered tenders from Elasticsearch",
      "/api/synctenders": "Sync tenders from external API to Elasticsearch"
    }
  });
} 