
// API configuration
const API_CONFIG = {
  // Default to local server if in development mode
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  // Fallback to the remote server if specified
  REMOTE_URL: "https://script-scribe-conlang-creator.onrender.com",
};

export default API_CONFIG;
