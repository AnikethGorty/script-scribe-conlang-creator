
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Database, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { checkServerHealth } from "@/services/trainingService";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {healthStatus.loading ? (
              <LoaderCircle className="animate-spin" />
            ) : healthStatus.isHealthy ? (
              <Database className="text-green-500" />
            ) : (
              <Database className="text-red-500" />
            )}
            MongoDB Connection Status
          </DialogTitle>
          <DialogDescription>
            Checking if the backend service and database are available
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
                  <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-mono break-all">
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
              
              {!healthStatus.isHealthy && (
                <div className="text-sm text-muted-foreground">
                  <p>Please make sure:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>The backend server is running</li>
                    <li>Your MongoDB connection string is correctly configured in .env</li>
                    <li>MongoDB Atlas service is available</li>
                  </ul>
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
