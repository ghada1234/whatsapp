// API Configuration
const config = {
  // In development, use local API
  // In production, use deployed backend API
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
};

export default config;

