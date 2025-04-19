"use client";

import { useState, useEffect } from "react";
import { SyncSettingsForm } from "../sync-settings";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Clock, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { SyncSettings } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
// Create a stub implementation to avoid the import error
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string, description?: string, variant?: string }) => {
    console.log(`Toast: ${title} - ${description}`);
  }
});
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { syncTendersAction } from "../../actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the structure of a sync log entry
interface SyncLogEntry {
  id: string;
  timestamp: Date;
  settings: SyncSettings;
  result: {
    success: boolean;
    message: string;
    stats?: {
      total: number;
      added: number;
      updated: number;
      failed: number;
    };
  };
}

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
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const { toast } = useToast();

  // Load sync log from localStorage on component mount
  useEffect(() => {
    const savedLog = localStorage.getItem('tenderSyncLog');
    if (savedLog) {
      try {
        // Parse the saved log and convert timestamp strings back to Date objects
        const parsedLog = JSON.parse(savedLog, (key, value) => {
          if (key === 'timestamp') {
            return new Date(value);
          }
          return value;
        });
        setSyncLog(parsedLog);
      } catch (error) {
        console.error('Error loading sync log from localStorage:', error);
      }
    }
  }, []);

  // Save sync log to localStorage whenever it changes
  useEffect(() => {
    if (syncLog.length > 0) {
      localStorage.setItem('tenderSyncLog', JSON.stringify(syncLog));
    }
  }, [syncLog]);

  async function handleSync(syncSettings: SyncSettings) {
    setIsLoading(true);
    try {
      // Use the server action to sync tenders with the provided settings
      const result = await syncTendersAction(syncSettings);
      setLastSyncResult(result);
      
      // Add this sync operation to the log
      const newLogEntry: SyncLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        settings: { ...syncSettings },
        result
      };
      
      // Add to the beginning of the log (most recent first)
      setSyncLog(prev => [newLogEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
      
      toast({
        title: result.success ? "Sync Successful" : "Sync Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error syncing tenders:", error);
      const errorResult = {
        success: false,
        message: `An unexpected error occurred: ${(error as Error).message}`,
      };
      
      setLastSyncResult(errorResult);
      
      // Add the failed sync to the log
      const newLogEntry: SyncLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        settings: { ...syncSettings },
        result: errorResult
      };
      
      setSyncLog(prev => [newLogEntry, ...prev.slice(0, 49)]);
      
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
  }

  // Helper function to format settings as a string for display
  function formatSettings(settings: SyncSettings): string {
    const parts = [];
    
    if (settings.pageSize) parts.push(`Page Size: ${settings.pageSize}`);
    if (settings.tenderCategory) parts.push(`Category: ${settings.tenderCategory}`);
    if (settings.tenderActivityId) parts.push(`Activity: ${settings.tenderActivityId}`);
    if (settings.tenderAreasIdString) parts.push(`Region: ${settings.tenderAreasIdString}`);
    if (settings.fields) {
      const fieldsStr = Array.isArray(settings.fields) 
        ? settings.fields.join(',') 
        : settings.fields;
      parts.push(`Fields: ${fieldsStr}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Default settings';
  }

  // Function to clear sync log
  function clearSyncLog() {
    setSyncLog([]);
    localStorage.removeItem('tenderSyncLog');
    toast({
      title: "Sync Log Cleared",
      description: "All sync history has been cleared.",
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SyncSettingsForm 
          onSave={handleSaveSettings} 
          onSync={handleSync}
          defaultSettings={settings} 
          isLoading={isLoading}
        />

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
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure your sync settings and click "Sync Now" to start syncing tenders
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Sync Log Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Sync Log</CardTitle>
                <CardDescription>History of synchronization operations</CardDescription>
              </div>
              {syncLog.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSyncLog}
                >
                  Clear Log
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {syncLog.length > 0 ? (
                <ScrollArea className="h-[300px] rounded-md border">
                  <Accordion type="single" collapsible className="w-full">
                    {syncLog.map((entry, index) => (
                      <AccordionItem value={entry.id} key={entry.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center space-x-2">
                              <Badge variant={entry.result.success ? "default" : "destructive"}>
                                {entry.result.success ? "Success" : "Failed"}
                              </Badge>
                              <span className="text-sm font-medium flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>
                            {entry.result.stats && (
                              <span className="text-sm text-muted-foreground">
                                {entry.result.stats.total} records
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 py-2">
                            <div>
                              <h4 className="text-sm font-medium">Settings Used</h4>
                              <p className="text-sm text-muted-foreground">{formatSettings(entry.settings)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Result</h4>
                              <p className="text-sm text-muted-foreground">{entry.result.message}</p>
                            </div>
                            {entry.result.stats && (
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="text-xs">
                                  <span className="font-medium">Added:</span> {entry.result.stats.added}
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium">Updated:</span> {entry.result.stats.updated}
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium">Failed:</span> {entry.result.stats.failed}
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium">Total:</span> {entry.result.stats.total}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No sync history available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sync operations will be recorded here
                    </p>
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