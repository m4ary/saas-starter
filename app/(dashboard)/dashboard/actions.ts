'use server';

import { SyncSettings } from '@/lib/utils';
import { syncTenders } from '@/lib/server/elasticsearch-service';

// Server action for syncing tenders
export async function syncTendersAction(settings: SyncSettings) {
  try {
    return await syncTenders(settings);
  } catch (error) {
    console.error('Error in sync tenders action:', error);
    return {
      success: false,
      message: `Server action error: ${(error as Error).message}`
    };
  }
} 