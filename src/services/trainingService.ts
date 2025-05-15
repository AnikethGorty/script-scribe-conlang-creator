
import axios from "axios";
import API_CONFIG from "@/config/api.ts";
import { toast } from "@/components/ui/sonner";

// Create axios instance with timeout
const apiClient = axios.create({
  timeout: API_CONFIG.TIMEOUT
});

// Function to check if the server is available
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get(`${API_CONFIG.getActiveURL()}/health`, { 
      timeout: 3000 
    });
    return response.status === 200;
  } catch (error) {
    console.error("Server health check failed:", error);
    return false;
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
      if (axios.isAxiosError(error) && !error.response) {
        // Network error (server not running)
        toast.error("Error contacting server. Is the backend running?");
        throw new Error("Failed to connect to the Flask backend. Make sure the server is running.");
      }
    }
    
    throw new Error("Failed to parse sentence");
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
    return response.data;
  } catch (error) {
    console.error("Error submitting word data:", error);
    
    // Check for specific error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status code
        throw new Error(`Server error: ${error.response.data.error || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error("No response from server. Please check your connection.");
      }
    }
    
    throw new Error("Failed to submit word data");
  }
};

// Function to get all words from the database
export const getWords = async () => {
  try {
    const response = await apiClient.get(`${API_CONFIG.getActiveURL()}/get-words`);
    return response.data;
  } catch (error) {
    console.error("Error getting words:", error);
    throw new Error("Failed to get words");
  }
};
