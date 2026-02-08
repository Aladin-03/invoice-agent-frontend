import { API_CONFIG } from '../config'

export const fetchVendors = async () => {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RATES}`)
  const data = await response.json()
  return data
}

export const fetchVendorDetails = async (vendorCode) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDOR(vendorCode)}`)
  const data = await response.json()
  return data
}

export const fetchVersionData = async (vendorCode, versionId) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERSION(vendorCode, versionId)}`)
  const data = await response.json()
  return data
}

export const uploadRateCard = async (file) => {
  const formData = new FormData()
  formData.append('rate_file', file)
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
    method: 'POST',
    body: formData
  })
  const data = await response.json()
  return data
}

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}
