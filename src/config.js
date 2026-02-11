export const API_CONFIG = {
  BASE_URL: 'https://invoice-agent-backend-854423996055.europe-west4.run.app',
  ENDPOINTS: {
    RATES: '/api/rates',
    VENDOR: (vendorCode) => `/api/rates/${vendorCode}`,
    VERSION: (vendorCode, versionId) => `/api/rates/${vendorCode}/versions/${versionId}`,
    UPLOAD: '/api/rates/upload'
  }
}
