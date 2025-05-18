
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Database, CircleCheck, CircleX, LoaderCircle, RefreshCw, HardDrive, AlertTriangle } from "lucide-react";
import { checkServerHealth } from "@/services/trainingService";
import { syncSQLiteToMongoDB } from "@/services/trainingService";
import { toast } from "@/components/ui/sonner";

type HealthStatus = {
  isHealthy: boolean;
  details: any;
  loading: boolean;
};

export function MongoDBHealthDialog() {
  const [open, setOpen] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    details: null,
    loading: true,
  });
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await checkServerHealth();
        setHealthStatus({
          isHealthy: result.isHealthy && result.details?.mongodb?.connection === "successful",
          details: result.details,
          loading: false,
        });
      } catch (error) {
        setHealthStatus({
          isHealthy: false,
          details: { error: "Failed to check server health" },
          loading: false,
        });
      }
    };

    checkHealth();
  }, []);

  const handleRetry = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true }));
    try {
      const result = await checkServerHealth();
      setHealthStatus({
        isHealthy: result.isHealthy && result.details?.mongodb?.connection === "successful",
        details: result.details,
        loading: false,
      });
    } catch (error) {
      setHealthStatus({
        isHealthy: false,
        details: { error: "Failed to check server health" },
        loading: false,
      });
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const result = await syncSQLiteToMongoDB();
      if (result.success) {
        toast.success(`${result.message}`);
        await handleRetry(); // Refresh status after sync
      } else {
        toast.error(`Sync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Failed to sync data to MongoDB");
    } finally {
      setSyncLoading(false);
    }
  };

  // Get the database statuses
  const mongodbAvailable = healthStatus.details?.mongodb?.connection === "successful";
  const sqliteAvailable = healthStatus.details?.sqlite?.status === "active";
  const isSqliteFallbackActive = healthStatus.details?.sqlite?.fallback_active;
  
  // Determine overall connection status message
  const getConnectionStatusMessage = () => {
    if (healthStatus.loading) return "Checking connections...";
    
    if (mongodbAvailable && sqliteAvailable) {
      return "Both MongoDB and SQLite are available.";
    } else if (mongodbAvailable) {
      return "MongoDB is available, but SQLite is not accessible.";
    } else if (sqliteAvailable) {
      return "Using SQLite as fallback storage. MongoDB is unavailable.";
    } else {
      return "Critical: No database connections available!";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {healthStatus.loading ? (
              <LoaderCircle className="animate-spin" />
            ) : mongodbAvailable && sqliteAvailable ? (
              <Database className="text-green-500" />
            ) : (!mongodbAvailable && !sqliteAvailable) ? (
              <AlertTriangle className="text-red-500" />
            ) : (
              <Database className="text-amber-500" />
            )}
            Database Connection Status
          </DialogTitle>
          <DialogDescription>
            {getConnectionStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {healthStatus.loading ? (
            <div className="flex items-center justify-center py-4">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Checking connection...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {/* MongoDB Status */}
                <div className="border rounded-md p-3">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Database size={18} /> MongoDB
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Server Status:</span>
                      {healthStatus.details?.status === "ok" ? (
                        <span className="flex items-center text-green-500">
                          <CircleCheck className="mr-1 h-4 w-4" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-500">
                          <CircleX className="mr-1 h-4 w-4" />
                          Degraded
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">MongoDB Connection:</span>
                      {healthStatus.details?.mongodb?.connection === "successful" ? (
                        <span className="flex items-center text-green-500">
                          <CircleCheck className="mr-1 h-4 w-4" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500">
                          <CircleX className="mr-1 h-4 w-4" />
                          Disconnected
                        </span>
                      )}
                    </div>

                    {/* Display connection string information */}
                    {healthStatus.details?.mongodb?.connection_string_preview && (
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono break-all">
                        <p className="font-medium mb-1">Connection String:</p>
                        <code>{healthStatus.details.mongodb.connection_string_preview}</code>
                      </div>
                    )}

                    {healthStatus.details?.mongodb?.connection === "failed" && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>
                          {healthStatus.details.mongodb.error || "Could not connect to the database."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {healthStatus.details?.mongodb?.database && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Connected to: {healthStatus.details.mongodb.database}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* SQLite Status */}
                {healthStatus.details?.sqlite && (
                  <div className="border rounded-md p-3">
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <HardDrive size={18} /> SQLite (Local Fallback)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        {healthStatus.details.sqlite.status === "active" ? (
                          <span className="flex items-center text-green-500">
                            <CircleCheck className="mr-1 h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <CircleX className="mr-1 h-4 w-4" />
                            Unavailable
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Role:</span>
                        {healthStatus.details.sqlite.fallback_active ? (
                          <span className="text-amber-500 font-medium">Active (Primary Storage)</span>
                        ) : (
                          <span className="text-muted-foreground">Standby</span>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Location: {healthStatus.details.sqlite.location}
                      </div>
                      
                      {isSqliteFallbackActive && (
                        <Alert className="mt-2 bg-amber-50 border-amber-200">
                          <AlertDescription className="text-amber-700">
                            MongoDB is unavailable. Words are being saved to the local SQLite database and will be
                            synchronized when MongoDB connection is restored.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {!sqliteAvailable && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription>
                            SQLite is not accessible. This may indicate an issue with file permissions or disk space.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Critical Error Alert - Both databases unavailable */}
                {!mongodbAvailable && !sqliteAvailable && (
                  <Alert variant="destructive" className="mt-4 border-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <AlertDescription className="font-semibold">
                      Critical: All database connections failed. Your word data cannot be saved!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Sync button - only show when MongoDB is available but we've been in fallback mode */}
              {healthStatus.isHealthy && isSqliteFallbackActive && (
                <div className="flex flex-col items-center p-3 border rounded-md bg-green-50 border-green-200">
                  <p className="text-sm text-center mb-2 text-green-700">
                    MongoDB is now available! You can sync data from your local database.
                  </p>
                  <Button 
                    onClick={handleSync} 
                    disabled={syncLoading} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {syncLoading ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync Local Data to MongoDB
                  </Button>
                </div>
              )}
              
              {!healthStatus.isHealthy && (
                <div className="text-sm text-muted-foreground">
                  <p>Please make sure:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>The backend server is running</li>
                    <li>Your MongoDB connection string is correctly configured in .env</li>
                    <li>MongoDB Atlas service is available</li>
                  </ul>
                  {sqliteAvailable && (
                    <p className="mt-2 font-medium">
                      Don't worry! Your vocabulary is safely stored in the local database.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleRetry}>
            <LoaderCircle className={`mr-2 h-4 w-4 ${healthStatus.loading ? "animate-spin" : ""}`} />
            Retry Connection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MongoDBHealthDialog;
