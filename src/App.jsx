import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import ControlsSection from './components/ControlsSection'
import RatesModal from './components/RatesModal'
import InvoiceProcessing from './components/InvoiceProcessing'
import { API_CONFIG } from './config'
import { 
  fetchVendors, 
  fetchVendorDetails, 
  fetchVersionData,
  uploadRateCard
} from './utils/api'

function App() {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [vendorDetails, setVendorDetails] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState('')
  const [versionData, setVersionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [showRatesModal, setShowRatesModal] = useState(false)

  // Fetch vendors on mount
  useEffect(() => {
    loadVendors()
  }, [])

  // Fetch vendor details when selected
  useEffect(() => {
    if (selectedVendor) {
      loadVendorDetails(selectedVendor)
    }
  }, [selectedVendor])

  const loadVendors = async () => {
    setLoading(true)
    try {
      const data = await fetchVendors()
      if (data.success) {
        setVendors(data.vendors)
        if (data.vendors.length > 0) {
          setSelectedVendor(data.vendors[0].vendor_code)
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
    setLoading(false)
  }

  const loadVendorDetails = async (vendorCode) => {
    setLoading(true)
    setSelectedVersion('')
    setVersionData(null)
    try {
      const data = await fetchVendorDetails(vendorCode)
      if (data.success) {
        setVendorDetails(data)
        if (data.available_versions.length > 0) {
          setSelectedVersion(data.available_versions[0].version_id)
        }
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error)
    }
    setLoading(false)
  }

  const handleViewRates = async () => {
    if (!selectedVendor || !selectedVersion) {
      alert('Please select a vendor and version')
      return
    }

    setLoading(true)
    try {
      const data = await fetchVersionData(selectedVendor, selectedVersion)
      if (data.success) {
        setVersionData(data)
        setShowRatesModal(true)
      }
    } catch (error) {
      console.error('Error fetching version data:', error)
      alert('Error loading rates')
    }
    setLoading(false)
  }

  const handleUploadRateCard = async () => {
    if (!uploadFile) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    setUploadSuccess(null)
    
    try {
      const data = await uploadRateCard(uploadFile)
      
      if (data.success) {
        setUploadSuccess(data)
        setUploadFile(null)
        document.getElementById('file-upload').value = ''
        // Refresh vendors list
        loadVendors()
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Upload failed: ' + error.message)
    }
    setUploading(false)
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/template.xlsx'
    link.download = 'rate_card_template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

   return (
    <div className="app">
      <div className="container">
        <Header />

        <main>
          {/* Rates Section */}
          <section>
            <h2 className="section-title">Rate Cards Management</h2>
            <ControlsSection
              vendors={vendors}
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              vendorDetails={vendorDetails}
              selectedVersion={selectedVersion}
              setSelectedVersion={setSelectedVersion}
              loading={loading}
              uploadFile={uploadFile}
              setUploadFile={setUploadFile}
              uploading={uploading}
              uploadSuccess={uploadSuccess}
              onViewRates={handleViewRates}
              onUploadRateCard={handleUploadRateCard}
              onDownloadTemplate={handleDownloadTemplate}
            />

            {loading && <div className="loading">Loading...</div>}
          </section>

          {/* Invoice Processing Section */}
          <section>
            <h2 className="section-title">Invoice Processing</h2>
            <InvoiceProcessing apiBaseUrl={API_CONFIG.BASE_URL} />
          </section>
        </main>
      </div>

      <RatesModal
        show={showRatesModal}
        onClose={() => setShowRatesModal(false)}
        versionData={versionData}
      />
    </div>
  )
}

export default App
