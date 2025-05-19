
import axios from "axios";
import API_CONFIG from "@/config/api.ts";
import { toast } from "@/components/ui/sonner";
import { 
  addWordToSupabase, 
  getAllWordsFromSupabase, 
  getKnownWordsFromSupabase 
} from "./supabaseService";

// Create axios instance with timeout
const apiClient = axios.create({
  timeout: API_CONFIG.TIMEOUT
});

// Function to check if the server is available
export const checkServerHealth = async (): Promise<{isHealthy: boolean, details: any}> => {
  try {
    const response = await apiClient.get(`${API_CONFIG.getActiveURL()}/health`, { 
      timeout: 5000 
    });
    
    // Log detailed information about the server health
    console.log("Server health response:", response.data);
    
    // Show warning toast for database connection issues
    if (response.data.status === "critical") {
      toast.error("Critical: All database connections failed. Words will be saved to Supabase!");
    } else if (response.data.status === "degraded") {
      if (response.data.mongodb && response.data.mongodb.connection === "failed" && 
          response.data.sqlite && response.data.sqlite.status === "active") {
        toast.warning("MongoDB connection failed. Using Supabase for vocabulary storage.");
      } else if (response.data.sqlite && response.data.sqlite.status !== "active" && 
                 response.data.mongodb && response.data.mongodb.connection === "successful") {
        toast.warning("SQLite is unavailable. Using Supabase for vocabulary storage.");
      }
    }
    
    if (response.data.supabase_recommended) {
      toast.info("Using Supabase for vocabulary storage.");
    }
    
    return {
      isHealthy: response.status === 200,
      details: response.data
    };
  } catch (error) {
    console.error("Server health check failed:", error);
    toast.error("Failed to connect to the server. Using Supabase for vocabulary storage.");
    
    return {
      isHealthy: false,
      details: { 
        error: axios.isAxiosError(error) ? 
          (error.message || "Network connection failed") : 
          "Unknown error",
        status: "error", 
        mongodb: { connection: "failed" },
        sqlite: { status: "error" },
        supabase_recommended: true
      }
    };
  }
};

// Function to parse a sentence and get unknown words
export const parseSentence = async (sentence: string) => {
  try {
    // First try to get server-side NLP parsing
    console.log(`Sending request to: ${API_CONFIG.getActiveURL()}/parse-sentence`);
    const response = await apiClient.post(`${API_CONFIG.getActiveURL()}/parse-sentence`, { sentence });
    return response.data;
  } catch (error) {
    console.error("Error parsing sentence from server:", error);
    
    // If server fails, try to parse client-side using Supabase for known words
    try {
      toast.info("Server unavailable. Parsing sentence client-side with Supabase data.");
      const words = sentence.toLowerCase()
        .replace(/[^\w\s'-]/g, '')  // Remove punctuation except apostrophes and hyphens
        .split(/\s+/)               // Split by whitespace
        .filter(word => word.length > 0);
      
      // Get known words from Supabase
      const knownWords = await getKnownWordsFromSupabase();
      
      // Find unknown words
      const unknownWords = words.filter(word => !knownWords.includes(word));
      // Remove duplicates while preserving order
      const uniqueUnknownWords = [...new Set(unknownWords)];
      
      return { unknown_words: uniqueUnknownWords };
    } catch (clientError) {
      console.error("Client-side parsing failed:", clientError);
      throw new Error("Failed to parse sentence. Please try again later.");
    }
  }
};

// Function to submit word data to the database
export const submitWordData = async (word: string, meaning: string, type: string, context: string) => {
  try {
    // First try to save to the server
    const serverResponse = await apiClient.post(`${API_CONFIG.getActiveURL()}/submit-word`, {
      word,
      meaning,
      type,
      context
    }).catch(error => {
      console.error("Server storage failed:", error);
      return null;
    });
    
    // Always try to save to Supabase regardless of server response
    const supabaseSuccess = await addWordToSupabase(word, meaning, type, context);
    
    if (serverResponse?.data) {
      // Show toast with appropriate storage information
      if (serverResponse.data.storage === "sqlite") {
        toast.info(`Word saved to local SQLite database and Supabase.`);
      } else if (serverResponse.data.storage === "mongodb") {
        toast.success(`Word saved to MongoDB and Supabase databases.`);
      } else if (serverResponse.data.storage === "none") {
        if (supabaseSuccess) {
          toast.success(`Word saved to Supabase database.`);
        } else {
          toast.error(`Failed to save word. All database connections unavailable.`);
        }
      }
      
      return { ...serverResponse.data, supabase_success: supabaseSuccess };
    } else {
      // Server failed but Supabase succeeded
      if (supabaseSuccess) {
        toast.success(`Word saved to Supabase database.`);
        return { success: true, message: `Word saved to Supabase`, storage: "supabase" };
      } else {
        toast.error(`Failed to save word. All database connections unavailable.`);
        throw new Error("Failed to save word to any database");
      }
    }
  } catch (error) {
    console.error("Error submitting word data:", error);
    
    // Try Supabase as a last resort if not already tried
    try {
      const supabaseSuccess = await addWordToSupabase(word, meaning, type, context);
      if (supabaseSuccess) {
        toast.success(`Word saved to Supabase database.`);
        return { success: true, message: `Word saved to Supabase`, storage: "supabase" };
      }
    } catch (supabaseError) {
      console.error("Final Supabase attempt failed:", supabaseError);
    }
    
    toast.error("Failed to save word. Please try again later.");
    throw new Error("Failed to submit word data to any database");
  }
};

// Function to get all words from the database
export const getWords = async () => {
  try {
    // First try to get from server
    const serverResponse = await apiClient.get(`${API_CONFIG.getActiveURL()}/get-words`)
      .catch(error => {
        console.error("Server get words failed:", error);
        return null;
      });
    
    // Always try to get from Supabase
    const supabaseWords = await getAllWordsFromSupabase();
    
    if (serverResponse?.data?.words && serverResponse.data.words.length > 0) {
      // Show toast with storage information if from SQLite
      if (serverResponse.data.source === "sqlite") {
        toast.info("Showing words from local SQLite database and Supabase.");
      } else if (serverResponse.data.source === "mongodb") {
        toast.info("Showing words from MongoDB and Supabase.");
      }
      
      // Merge data, preferring server data but ensuring all Supabase words are included
      const serverWords = serverResponse.data.words;
      const serverWordSet = new Set(serverWords.map((w: any) => w.word));
      
      // Add Supabase words that aren't in server response
      const uniqueSupabaseWords = supabaseWords.filter(w => !serverWordSet.has(w.word));
      
      return {
        words: [...serverWords, ...uniqueSupabaseWords],
        source: `${serverResponse.data.source}+supabase`,
        count: serverWords.length + uniqueSupabaseWords.length
      };
    } else {
      // Server failed or returned no words, use Supabase
      toast.info("Showing words from Supabase database.");
      return {
        words: supabaseWords,
        source: "supabase",
        count: supabaseWords.length
      };
    }
  } catch (error) {
    console.error("Error getting words:", error);
    
    // Try Supabase as a fallback
    try {
      const supabaseWords = await getAllWordsFromSupabase();
      toast.info("Showing words from Supabase database.");
      return {
        words: supabaseWords,
        source: "supabase",
        count: supabaseWords.length
      };
    } catch (supabaseError) {
      console.error("Supabase fallback failed:", supabaseError);
      toast.error("Failed to retrieve words from any database.");
      throw new Error("Failed to get words from any database");
    }
  }
};

// Function to sync SQLite data to MongoDB
export const syncSQLiteToMongoDB = async () => {
  try {
    const response = await apiClient.post(`${API_CONFIG.getActiveURL()}/sync-to-mongodb`);
    return response.data;
  } catch (error) {
    console.error("Error syncing SQLite to MongoDB:", error);
    
    toast.error("Failed to sync data to MongoDB, but Supabase is used as primary storage.");
    return { 
      error: "Sync failed but Supabase is being used", 
      supabase_active: true 
    };
  }
};
