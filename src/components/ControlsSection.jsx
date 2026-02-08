import { formatDateTime } from '../utils/api'

function ControlsSection({
  vendors,
  selectedVendor,
  setSelectedVendor,
  vendorDetails,
  selectedVersion,
  setSelectedVersion,
  loading,
  uploadFile,
  setUploadFile,
  uploading,
  uploadSuccess,
  onViewRates,
  onUploadRateCard,
  onDownloadTemplate
}) {
  return (
    <div className="card">
      <div className="controls-grid">
        {/* Row 1: Vendor and Version Selection */}
        <div className="control-item">
          <label htmlFor="vendor-select">Select Vendor</label>
          <select
            id="vendor-select"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            disabled={loading}
          >
            {vendors.map((vendor) => (
              <option key={vendor.vendor_code} value={vendor.vendor_code}>
                {vendor.vendor_name} ({vendor.vendor_code})
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label htmlFor="version-select">Select Rate Version</label>
          <select
            id="version-select"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            disabled={!vendorDetails || loading}
          >
            <option value="">Select a version</option>
            {vendorDetails?.available_versions?.map((version) => (
              <option key={version.version_id} value={version.version_id}>
                {version.version_id} - {formatDateTime(version.uploaded_at)}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label style={{ visibility: 'hidden' }}>Action</label>
          <button
            className="button button-full"
            onClick={onViewRates}
            disabled={!selectedVersion || loading}
          >
            View Rates
          </button>
        </div>

        {/* Row 2: Upload Controls */}
        <div className="control-item">
          <label htmlFor="file-upload-btn">Upload New Rate Card</label>
          <label htmlFor="file-upload" className="file-input-label">
            {uploadFile ? uploadFile.name : 'Choose XLSX file'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="file-input-hidden"
          />
        </div>

        <div className="control-item">
          <label style={{ visibility: 'hidden' }}>Upload</label>
          <button
            className="button button-full"
            onClick={onUploadRateCard}
            disabled={!uploadFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Rate Card'}
          </button>
        </div>

        <div className="control-item">
          <label style={{ visibility: 'hidden' }}>Download</label>
          <button
            className="button button-secondary button-full"
            onClick={onDownloadTemplate}
          >
            Download Template
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="success-message">
          ✓ Successfully uploaded {uploadSuccess.vendor_name} - Version: {uploadSuccess.version_id}
        </div>
      )}
    </div>
  )
}

export default ControlsSection
