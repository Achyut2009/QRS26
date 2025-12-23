// Create a config file
// /lib/config.ts
const getBaseUrl = () => {
  if (__DEV__) {
    return 'http://YOUR_LOCAL_IP:3001'; // Replace with your local IP
  }
  return 'https://your-production-server.com'; // Your deployed server
};

export const API_BASE_URL = getBaseUrl();