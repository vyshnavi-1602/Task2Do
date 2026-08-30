// Validate and export environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("❌ Missing required environment variable: VITE_API_BASE_URL");
}

export const env = {
  API_BASE_URL: API_BASE_URL || 'http://localhost:3000/api/v1',
};
