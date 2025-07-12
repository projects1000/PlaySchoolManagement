export const environment = {
  production: true,
  apiUrl: 'https://playschoolmanagementbackend.onrender.com/api', // Your deployed backend on Render
  apiTimeout: 20000, // Higher timeout for production
  cacheTimeout: 600000, // 10 minutes
  features: {
    offlineMode: true,
    pwaInstall: true,
    pushNotifications: true
  }
};
