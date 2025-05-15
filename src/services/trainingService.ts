
import axios from "axios";
import API_CONFIG from "../config/api.ts";

const API_BASE_URL = API_CONFIG.BASE_URL;
const FALLBACK_URL = API_CONFIG.REMOTE_URL;

// Helper function to try both local and remote APIs
const tryAPI = async (endpoint: string, data: any, method: 'get' | 'post' = 'post') => {
  try {
    // First try the primary API
    if (method === 'post') {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
      return response.data;
    } else {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      return response.data;
    }
  } catch (primaryError) {
    console.warn(`Primary API failed: ${primaryError.message}`);
    
    try {
      // Fall back to the remote API
      if (API_BASE_URL !== FALLBACK_URL) {
        if (method === 'post') {
          const fallbackResponse = await axios.post(`${FALLBACK_URL}${endpoint}`, data);
          console.info("Successfully used fallback API");
          return fallbackResponse.data;
        } else {
          const fallbackResponse = await axios.get(`${FALLBACK_URL}${endpoint}`);
          console.info("Successfully used fallback API");
          return fallbackResponse.data;
        }
      }
      throw primaryError; // If there's no different fallback URL, rethrow the original error
    } catch (fallbackError) {
      console.error("All API attempts failed:", fallbackError);
      throw new Error("Server connection failed. Please check if the backend is running.");
    }
  }
};

export const parseSentence = async (sentence: string) => {
  try {
    return await tryAPI('/parse-sentence', { sentence });
  } catch (error) {
    console.error("Error parsing sentence:", error);
    throw error;
  }
};

export const submitWordData = async (
  word: string,
  meaning: string,
  type: string,
  context: string
) => {
  try {
    return await tryAPI('/submit-word', {
      word,
      meaning,
      type,
      context
    });
  } catch (error) {
    console.error("Error submitting word data:", error);
    throw error;
  }
};

export const getWords = async () => {
  try {
    return await tryAPI('/get-words', null, 'get');
  } catch (error) {
    console.error("Error getting words:", error);
    throw error;
  }
};
