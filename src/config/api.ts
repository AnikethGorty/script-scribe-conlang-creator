
// API configuration
const API_CONFIG = {
  // Default to local server if in development mode
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  // Fallback to the remote server if specified
  REMOTE_URL: "https://script-scribe-conlang-creator.onrender.com",
  // Helper to determine if we're in development mode
  isDevelopment: () => import.meta.env.DEV === true,
  // Get the active API URL based on connection status
  getActiveURL: function() {
    return this.isDevelopment() ? this.BASE_URL : this.REMOTE_URL;
  },
  // Timeout for API requests in milliseconds
  TIMEOUT: 10000
};

export default API_CONFIG;
