// Auto-detect environment based on hostname  
function getApiUrl(): string {
  // Production build always uses cloud backend
  return 'https://playschoolmanagementbackend.onrender.com/api';
}

function isLocalEnvironment(): boolean {
  // Production build is never considered local
  return false;
}

export const environment = {
  production: true,
  apiUrl: getApiUrl(),
  isLocal: isLocalEnvironment(),
  apiTimeout: 20000,
  cacheTimeout: 600000, // 10 minutes
  features: {
    offlineMode: true,
    pwaInstall: true,
    pushNotifications: true
  },
  auth: {
    username: 'admin',
    password: 'password'
  }
};
