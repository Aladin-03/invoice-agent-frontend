export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  ENDPOINTS: {
    RATES: '/api/rates',
    VENDOR: (vendorCode) => `/api/rates/${vendorCode}`,
    VERSION: (vendorCode, versionId) => `/api/rates/${vendorCode}/versions/${versionId}`,
    UPLOAD: '/api/rates/upload'
  }
}
