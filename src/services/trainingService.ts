
import axios from "axios";
import API_CONFIG from "@/config/api.ts";
import { toast } from "@/components/ui/sonner";

// Create axios instance with timeout
const apiClient = axios.create({
  timeout: API_CONFIG.TIMEOUT
});

// Function to check if the server is available
export const checkServerHealth = async (): Promise<{isHealthy: boolean, details: any}> => {
  try {
    const response = await apiClient.get(`${API_CONFIG.getActiveURL()}/health`, { 
      timeout: 3000 
    });
    
    // Log detailed information about the server health
    console.log("Server health response:", response.data);
    
    if (response.data.status !== "ok") {
      // Show warning if server is in degraded state
      console.warn("Server is in degraded state:", response.data);
      if (response.data.mongodb && response.data.mongodb.connection === "failed") {
        toast.error(`Database connection issue: ${response.data.mongodb.error || "Unknown error"}`);
      }
      
      // Alert if both databases are unavailable
      if (response.data.sqlite && response.data.sqlite.status !== "active" && 
          response.data.mongodb && response.data.mongodb.connection !== "successful") {
        toast.error("Critical: All database connections failed. Your word data cannot be saved!");
      }
    }
    
    return {
      isHealthy: response.status === 200,
      details: response.data
    };
  } catch (error) {
    console.error("Server health check failed:", error);
    return {
      isHealthy: false,
      details: { 
        error: axios.isAxiosError(error) ? 
          (error.message || "Network connection failed") : 
          "Unknown error",
        status: "error", 
        mongodb: { connection: "failed" },
        sqlite: { status: "unknown" } 
      }
    };
  }
};

// Function to parse a sentence and get unknown words
export const parseSentence = async (sentence: string) => {
  try {
    console.log(`Sending request to: ${API_CONFIG.getActiveURL()}/parse-sentence`);
    const response = await apiClient.post(`${API_CONFIG.getActiveURL()}/parse-sentence`, { sentence });
    return response.data;
  } catch (error) {
    console.error("Error parsing sentence:", error);
    
    // If we're in development mode, try to give more helpful errors
    if (API_CONFIG.isDevelopment()) {
      console.log("Development mode detected, providing detailed error information");
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          // Network error (server not running)
          toast.error("Cannot connect to server. Please check if the backend is running and properly configured.");
          
          // Try to do a health check
          checkServerHealth().then(health => {
            if (!health.isHealthy) {
              toast.error("Backend server is not responding. Please check server logs for details.");
            }
          });
          
          throw new Error("Failed to connect to the Flask backend. Make sure the server is running and MongoDB is properly configured.");
        } else if (error.response.status >= 500) {
          // Server error
          const errorMessage = error.response.data?.error || "Internal server error";
          toast.error(`Server error: ${errorMessage}`);
          throw new Error(`Server error: ${errorMessage}`);
        } else if (error.response.status >= 400) {
          // Client error
          const errorMessage = error.response.data?.error || "Invalid request";
          toast.error(`Request error: ${errorMessage}`);
          throw new Error(`Request error: ${errorMessage}`);
        }
      }
    }
    
    throw new Error("Failed to parse sentence. Please try again later.");
  }
};

// Function to submit word data to the database
export const submitWordData = async (word: string, meaning: string, type: string, context: string) => {
  try {
    const response = await apiClient.post(`${API_CONFIG.getActiveURL()}/submit-word`, {
      word,
      meaning,
      type,
      context
    });
    
    // Show toast with storage information
    if (response.data.storage === "sqlite") {
      toast.info(`Word saved to local SQLite database. Will sync to MongoDB when connection is restored.`);
    } else if (response.data.storage === "mongodb") {
      toast.success(`Word saved to MongoDB database.`);
    } else if (response.data.storage === "none") {
      toast.error(`Failed to save word. All database connections unavailable.`);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error submitting word data:", error);
    
    // Check for specific error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status code
        const errorMessage = error.response.data?.error || error.response.statusText;
        toast.error(`Database error: ${errorMessage}`);
        throw new Error(`Server error: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("No response from server. Please check your connection and server status.");
        throw new Error("No response from server. Please check your connection.");
      } else {
        // Error setting up the request
        toast.error(`Request configuration error: ${error.message}`);
        throw new Error(`Request error: ${error.message}`);
      }
    }
    
    toast.error("Failed to save word. Please try again later.");
    throw new Error("Failed to submit word data");
  }
};

// Function to get all words from the database
export const getWords = async () => {
  try {
    const response = await apiClient.get(`${API_CONFIG.getActiveURL()}/get-words`);
    
    // Show toast with storage information if from SQLite
    if (response.data.source === "sqlite") {
      toast.info("Showing words from local SQLite database. MongoDB is currently unavailable.");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error getting words:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.statusText;
        toast.error(`Database error: ${errorMessage}`);
        throw new Error(`Server error: ${errorMessage}`);
      } else if (error.request) {
        toast.error("No response from server. Please check your connection and server status.");
        throw new Error("No response from server. Please check your connection.");
      }
    }
    
    toast.error("Failed to retrieve words from database.");
    throw new Error("Failed to get words");
  }
};

// Function to sync SQLite data to MongoDB
export const syncSQLiteToMongoDB = async () => {
  try {
    const response = await apiClient.post(`${API_CONFIG.getActiveURL()}/sync-to-mongodb`);
    return response.data;
  } catch (error) {
    console.error("Error syncing SQLite to MongoDB:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.statusText;
        toast.error(`Sync error: ${errorMessage}`);
        throw new Error(`Server error: ${errorMessage}`);
      } else if (error.request) {
        toast.error("No response from server. Please check your connection and server status.");
        throw new Error("No response from server. Please check your connection.");
      }
    }
    
    toast.error("Failed to sync data to MongoDB.");
    throw new Error("Failed to sync data");
  }
};
