
import axios from "axios";
import API_CONFIG from "@/config/api.ts";

// Function to parse a sentence and get unknown words
export const parseSentence = async (sentence: string) => {
  try {
    const response = await axios.post(`${API_CONFIG.getActiveURL()}/parse-sentence`, { sentence });
    return response.data;
  } catch (error) {
    console.error("Error parsing sentence:", error);
    throw new Error("Failed to parse sentence");
  }
};

// Function to submit word data to the database
export const submitWordData = async (word: string, meaning: string, type: string, context: string) => {
  try {
    const response = await axios.post(`${API_CONFIG.getActiveURL()}/submit-word`, {
      word,
      meaning,
      type,
      context
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting word data:", error);
    throw new Error("Failed to submit word data");
  }
};

// Function to get all words from the database
export const getWords = async () => {
  try {
    const response = await axios.get(`${API_CONFIG.getActiveURL()}/get-words`);
    return response.data;
  } catch (error) {
    console.error("Error getting words:", error);
    throw new Error("Failed to get words");
  }
};
