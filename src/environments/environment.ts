export const environment = {
  production: false,
  apiUrl: 'https://playschoolmanagementbackend.onrender.com/api', // Your deployed backend on Render
  apiTimeout: 15000, // Increased timeout for cloud deployment
  cacheTimeout: 300000, // 5 minutes
  features: {
    offlineMode: true,
    pwaInstall: true,
    pushNotifications: true
  }
};
