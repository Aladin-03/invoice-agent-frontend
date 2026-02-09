import { useState } from 'react'
import './InvoiceProcessing.css'

function InvoiceProcessing({ 
  apiBaseUrl, 
  selectedVendor, 
  selectedVersion,
  vendors = [],
  vendorDetails 
}) {
  const [pdfFile, setPdfFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [invoiceData, setInvoiceData] = useState(null)
  const [error, setError] = useState(null)
  const [enableOcr, setEnableOcr] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError(null)
    } else {
      setError('Please select a valid PDF file')
      setPdfFile(null)
    }
  }

  const handleProcessInvoice = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first')
      return
    }

    if (!selectedVendor) {
      setError('Please select a vendor from the Rate Cards section above')
      return
    }

    if (!selectedVersion) {
      setError('Please select a rate card version from the Rate Cards section above')
      return
    }

    setProcessing(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('invoice_file', pdfFile)
    formData.append('vendor_code', selectedVendor)
    formData.append('version_id', selectedVersion)
    formData.append('enable_ocr', enableOcr)

    try {
      const response = await fetch(`${apiBaseUrl}/api/invoices/parse`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setInvoiceData(result.data)
        setError(null)
      } else {
        setError(result.message || 'Failed to process invoice')
        setInvoiceData(null)
      }
    } catch (err) {
      console.error('Error processing invoice:', err)
      setError('Error processing invoice: ' + err.message)
      setInvoiceData(null)
    }
    
    setProcessing(false)
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/invoice_template.pdf'
    link.download = 'invoice_template.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatLabel = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getRiskLevelClass = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'risk-critical'
      case 'HIGH': return 'risk-high'
      case 'MEDIUM': return 'risk-medium'
      case 'LOW': return 'risk-low'
      default: return ''
    }
  }

  const renderPickupDetails = (pickup) => {
    return (
      <div className="location-details">
        <div className="location-name">{pickup.name}</div>
        <div className="location-info">{pickup.address}</div>
        <div className="location-info">{pickup.city_state_zip}</div>
        <div className="location-meta">
          <span>Caller: {pickup.caller}</span>
          <span>Call: {pickup.call_time}</span>
        </div>
        <div className="location-meta">
          <span>Ref: {pickup.reference_number}</span>
          <span>Pickup: {pickup.pickup_time}</span>
        </div>
      </div>
    )
  }

  const renderDeliveryDetails = (delivery) => {
    return (
      <div className="location-details">
        <div className="location-name">{delivery.name}</div>
        <div className="location-info">{delivery.address}</div>
        <div className="location-info">{delivery.city_state_zip}</div>
      </div>
    )
  }

  const renderCharges = (charges) => {
    const chargeLabels = {
      base: 'Base',
      weight_pcs: 'Weight/Pcs',
      vehicle: 'Vehicle',
      wkd_hol_ot: 'Wkd/Hol/OT',
      fuel_surcharge: 'Fuel',
      wait_time: 'Wait Time'
    }

    return (
      <div className="charges-list">
        {Object.entries(charges).map(([key, value]) => {
          if (value !== null && value !== undefined) {
            return (
              <div key={key} className="charge-item">
                <span className="charge-label">{chargeLabels[key] || key}:</span>
                <span className="charge-value">{formatCurrency(value)}</span>
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  // Get selected vendor and version names for display
  const selectedVendorName = vendors?.find(v => v.vendor_code === selectedVendor)?.vendor_name || 'None selected'
  const selectedVersionId = selectedVersion || 'None selected'

  return (
    <div className="invoice-processing">
      {/* Upload Section */}
      <div className="card">
        <h2>Process Invoice</h2>
        
        {/* Display selected rate card info */}
        <div className="selected-rate-info">
          <div className="info-badge">
            <span className="info-label">Selected Vendor:</span>
            <span className="info-value">{selectedVendorName}</span>
          </div>
          <div className="info-badge">
            <span className="info-label">Selected Version:</span>
            <span className="info-value">{selectedVersionId}</span>
          </div>
        </div>

        <div className="upload-section">
          <div className="file-upload-group">
            <label htmlFor="pdf-upload" className="file-input-label">
              {pdfFile ? pdfFile.name : 'Choose PDF file'}
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-input-hidden"
            />
          </div>

          {/* OCR Checkbox */}
          <div className="ocr-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enableOcr}
                onChange={(e) => setEnableOcr(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Enable OCR-based tamper detection</span>
            </label>
          </div>
          
          <button
            className="button button-full"
            onClick={handleProcessInvoice}
            disabled={!pdfFile || !selectedVendor || !selectedVersion || processing}
            style={{ maxWidth: '200px' }}
          >
            {processing ? 'Processing...' : 'Process Invoice'}
          </button>

          <button
            className="button button-secondary button-full"
            onClick={handleDownloadTemplate}
            style={{ maxWidth: '200px' }}
          >
            Download Template
          </button>
        </div>

        {error && (
          <div className="error-message">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {invoiceData && (
        <>
          {/* Header Table */}
          <div className="card">
            <h3>Invoice Header</h3>
            <div className="header-table-container">
              <table className="header-table">
                <tbody>
                  {Object.entries(invoiceData.header).map(([key, value]) => (
                    <tr key={key}>
                      <td className="header-label">{formatLabel(key)}</td>
                      <td className="header-value">
                        {key === 'total_due' ? formatCurrency(value) : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Table */}
          <div className="card">
            <h3>Invoice Details ({invoiceData.main_table.length} records)</h3>
            <div className="main-table-container">
              <table className="main-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Date</th>
                    <th style={{ width: '100px' }}>Order No</th>
                    <th style={{ width: '80px' }}>Service</th>
                    <th style={{ width: '220px' }}>Pickup</th>
                    <th style={{ width: '180px' }}>Delivery</th>
                    <th style={{ width: '160px' }}>Charges</th>
                    <th style={{ width: '100px' }}>Total</th>
                    <th style={{ width: '150px' }}>Note</th>
                    <th style={{ width: '100px' }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.main_table.map((record, index) => (
                    <tr 
                      key={index}
                      className={record.flags.fraud ? 'tamper-row' : ''}
                    >
                      <td>{record.date}</td>
                      <td><strong>{record.order_no}</strong></td>
                      <td>
                        <span className="service-badge">{record.service_type}</span>
                      </td>
                      <td className="location-cell">
                        {renderPickupDetails(record.pickup_details)}
                      </td>
                      <td className="location-cell">
                        {renderDeliveryDetails(record.delivery_details)}
                      </td>
                      <td className="charges-cell">
                        {renderCharges(record.charges)}
                      </td>
                      <td className="total-cell">
                        <strong>{formatCurrency(record.total)}</strong>
                      </td>
                      <td className="note-cell">
                        {record.note && (
                          <span className="note-text" title={record.note}>
                            {record.note}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`risk-badge ${getRiskLevelClass(record.flags.risk_level)}`}>
                          {record.flags.risk_level}
                        </span>
                        {record.flags.fraud && (
                          <span className="tamper-flag">⚠️ TAMPERED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="card">
            <h3>Invoice Summary</h3>
            <div className={`summary-container ${invoiceData.summary.fraud_detected ? 'tamper-detected' : ''}`}>
              {/* Main Summary Grid */}
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Records</span>
                  <span className="summary-value">{invoiceData.summary.total_records}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Calculated Total</span>
                  <span className="summary-value">{formatCurrency(invoiceData.summary.calculated_total)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Header Total</span>
                  <span className="summary-value">{formatCurrency(invoiceData.summary.header_total)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Discrepancy</span>
                  <span className="summary-value discrepancy">
                    {formatCurrency(invoiceData.summary.total_discrepancy)}
                  </span>
                </div>
              </div>

              {/* Validation Status with Total Extra Charges */}
              <div className="validation-status">
              {/* Status Badge - only show REVIEW if there's a discrepancy */}
              {invoiceData.summary.extra_charges.total_extra_charges !== 0 && (
                <div className="status-badge status-review">
                  NEED REVIEW
                </div>
              )}
              
              {/* PASSED Badge - show when no discrepancy and no fraud */}
              {invoiceData.summary.total_discrepancy === 0 && !invoiceData.summary.extra_charges.total_extra_charges && (
                <div className="status-badge status-valid">
                  PASSED
                </div>
              )}
              
              {/* TAMPER Badge - show when fraud detected */}
              {invoiceData.summary.fraud_detected && (
                <div className="status-badge status-tamper">
                  TAMPER_DETECTED
                </div>
              )}

              {/* Total Extra Charges - always show if available */}
              {invoiceData.summary.extra_charges?.total_extra_charges !== undefined && (
                <div className="extra-charges-summary">
                  <span className="extra-charges-label">Total Extra Charges</span>
                  <span className="extra-charges-value">
                    {formatCurrency(invoiceData.summary.extra_charges.total_extra_charges)}
                  </span>
                </div>
              )}
              
              {/* Tamper Details */}
              {invoiceData.summary.fraud_detected && (
                <div className="tamper-details">
                  <span className="tamper-count">
                    ⚠️ {invoiceData.summary.total_fraud_discrepancies} Tamper Alert(s)
                  </span>
                  <span className="tamper-amount">
                    Tampered Amount: {formatCurrency(invoiceData.summary.total_fraudulent_amount)}
                  </span>
                </div>
              )}
            </div>

            </div>

            {/* Base Charges Analysis */}
            {invoiceData.summary.base_charges && (
              <div className="analysis-section">
                <h4>Base Charges Analysis</h4>
                <div className="analysis-grid">
                  <div className="analysis-card">
                    <div className="analysis-header">Under Charged</div>
                    <div className="analysis-content">
                      <div className="analysis-count">{invoiceData.summary.base_charges.under_charged}</div>
                      <div className="analysis-label">items</div>
                      <div className="analysis-amount under">{formatCurrency(invoiceData.summary.base_charges.under_charged_amount)}</div>
                    </div>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-header">Over Charged</div>
                    <div className="analysis-content">
                      <div className="analysis-count">{invoiceData.summary.base_charges.over_charged}</div>
                      <div className="analysis-label">items</div>
                      <div className="analysis-amount over">{formatCurrency(invoiceData.summary.base_charges.over_charged_amount)}</div>
                    </div>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-header">Total Items</div>
                    <div className="analysis-content">
                      <div className="analysis-count total">{invoiceData.summary.base_charges.total_items}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekend/Holiday/OT Analysis */}
            {invoiceData.summary.wkd_hol_ot && (
              <div className="analysis-section">
                <h4>Weekend/Holiday/OT Charges</h4>
                <div className="analysis-grid">
                  <div className="analysis-card">
                    <div className="analysis-header">Valid Charges</div>
                    <div className="analysis-content">
                      <div className="analysis-count">{invoiceData.summary.wkd_hol_ot.valid}</div>
                      <div className="analysis-label">items</div>
                      <div className="analysis-amount matched">{formatCurrency(invoiceData.summary.wkd_hol_ot.valid_amount)}</div>
                    </div>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-header">Invalid Charges</div>
                    <div className="analysis-content">
                      <div className="analysis-count">{invoiceData.summary.wkd_hol_ot.invalid}</div>
                      <div className="analysis-label">items</div>
                      <div className="analysis-amount over">{formatCurrency(invoiceData.summary.wkd_hol_ot.invalid_amount)}</div>
                    </div>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-header">Total Items</div>
                    <div className="analysis-content">
                      <div className="analysis-count total">{invoiceData.summary.wkd_hol_ot.total_items}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Types Breakdown */}
            {invoiceData.summary.service_types && (
              <div className="analysis-section">
                <h4>Service Types Breakdown</h4>
                <div className="service-types-grid">
                  {Object.entries(invoiceData.summary.service_types).map(([type, data]) => (
                    <div key={type} className="service-type-card">
                      <div className="service-type-badge">{type}</div>
                      <div className="service-type-details">
                        <div className="service-type-count">{data.count} shipments</div>
                        <div className="service-type-amount">{formatCurrency(data.total_amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Charges */}
            {invoiceData.summary.extra_charges && (
              <div className="analysis-section">
                <h4>Extra Charges Breakdown</h4>
                <div className="extra-charges-grid">
                  {invoiceData.summary.extra_charges.fuel_surcharge && (
                    <div className="extra-charge-card">
                      <div className="extra-charge-label">Fuel Surcharge</div>
                      <div className="extra-charge-count">{invoiceData.summary.extra_charges.fuel_surcharge.count} items</div>
                      <div className="extra-charge-amount">{formatCurrency(invoiceData.summary.extra_charges.fuel_surcharge.total_amount)}</div>
                    </div>
                  )}
                  {invoiceData.summary.extra_charges.vehicle_charge && (
                    <div className="extra-charge-card">
                      <div className="extra-charge-label">Vehicle Charge</div>
                      <div className="extra-charge-count">{invoiceData.summary.extra_charges.vehicle_charge.count} items</div>
                      <div className="extra-charge-amount">{formatCurrency(invoiceData.summary.extra_charges.vehicle_charge.total_amount)}</div>
                    </div>
                  )}
                  {invoiceData.summary.extra_charges.additional_charge && (
                    <div className="extra-charge-card">
                      <div className="extra-charge-label">Additional Charge</div>
                      <div className="extra-charge-count">{invoiceData.summary.extra_charges.additional_charge.count} items</div>
                      <div className="extra-charge-amount">{formatCurrency(invoiceData.summary.extra_charges.additional_charge.total_amount)}</div>
                    </div>
                  )}
                  <div className="extra-charge-card total-card">
                    <div className="extra-charge-label">Total Extra Charges</div>
                    <div className="extra-charge-amount total">{formatCurrency(invoiceData.summary.extra_charges.total_extra_charges)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InvoiceProcessing
