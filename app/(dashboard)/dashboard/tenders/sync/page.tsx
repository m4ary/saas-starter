"use client";

import { useState } from "react";
import { SyncSettingsForm } from "../sync-settings";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { SyncSettings } from "@/lib/utils";
// Create a stub implementation to avoid the import error
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string, description?: string, variant?: string }) => {
    console.log(`Toast: ${title} - ${description}`);
  }
});
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { syncTendersAction } from "../../actions";

export default function TenderSyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      total: number;
      added: number;
      updated: number;
      failed: number;
    };
  } | null>(null);
  const [settings, setSettings] = useState<SyncSettings>({});
  const { toast } = useToast();

  async function handleSync() {
    setIsLoading(true);
    try {
      // Use the server action to sync tenders
      const result = await syncTendersAction(settings);
      setLastSyncResult(result);
      
      toast({
        title: result.success ? "Sync Successful" : "Sync Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error syncing tenders:", error);
      setLastSyncResult({
        success: false,
        message: `An unexpected error occurred: ${(error as Error).message}`,
      });
      
      toast({
        title: "Sync Failed",
        description: `An unexpected error occurred: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveSettings(newSettings: SyncSettings) {
    setSettings(newSettings);
    toast({
      title: "Settings Saved",
      description: "Sync settings have been saved successfully.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tender Sync</h1>
          <p className="text-sm text-muted-foreground">
            Synchronize tenders from external sources
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isLoading ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SyncSettingsForm onSave={handleSaveSettings} defaultSettings={settings} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>Latest synchronization results</CardDescription>
            </CardHeader>
            <CardContent>
              {lastSyncResult ? (
                <div className="space-y-4">
                  <Alert variant={lastSyncResult.success ? "default" : "destructive"}>
                    <AlertTitle>{lastSyncResult.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{lastSyncResult.message}</AlertDescription>
                  </Alert>
                  
                  {lastSyncResult.stats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs font-medium">Total Records</div>
                        <div className="text-2xl font-bold">{lastSyncResult.stats.total.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs font-medium">Added</div>
                        <div className="text-2xl font-bold">{lastSyncResult.stats.added.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs font-medium">Updated</div>
                        <div className="text-2xl font-bold">{lastSyncResult.stats.updated.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs font-medium">Failed</div>
                        <div className="text-2xl font-bold">{lastSyncResult.stats.failed.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No sync results yet</p>
                    <Button onClick={handleSync} variant="outline" className="mt-4" disabled={isLoading}>
                      {isLoading ? "Syncing..." : "Start Sync"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 