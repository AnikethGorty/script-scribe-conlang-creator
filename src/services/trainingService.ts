
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

export const parseSentence = async (sentence: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/parse-sentence`, { sentence });
    return response.data;
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
    const response = await axios.post(`${API_BASE_URL}/submit-word`, {
      word,
      meaning,
      type,
      context
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting word data:", error);
    throw error;
  }
};

export const getWords = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-words`);
    return response.data;
  } catch (error) {
    console.error("Error getting words:", error);
    throw error;
  }
};
