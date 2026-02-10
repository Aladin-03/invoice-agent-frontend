import { useState, useEffect } from 'react'
import './CustomRulesModal.css'
import AIRatesAssistant from './AIRatesAssistant'

function CustomRulesModal({ show, onClose, selectedVendor, selectedVersion, apiBaseUrl, onSave }) {
  const [rateCardData, setRateCardData] = useState(null)
  const [editedRates, setEditedRates] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Editable vendor and version
  const [customVendorCode, setCustomVendorCode] = useState('')
  const [customVendorName, setCustomVendorName] = useState('')
  const [customVersionId, setCustomVersionId] = useState('')

  const [showAIAssistant, setShowAIAssistant] = useState(false)

  useEffect(() => {
    if (show && selectedVendor && selectedVersion) {
      fetchRateCardData()
    }
  }, [show, selectedVendor, selectedVersion])

  const fetchRateCardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/rates/${selectedVendor}/versions/${selectedVersion}`
      )
      const data = await response.json()
      
      if (data.success) {
        setRateCardData(data)
        
        // Set editable vendor and version from fetched data
        setCustomVendorCode(data.vendor_code)
        setCustomVendorName(data.vendor_name)
        setCustomVersionId(data.version_id)
        
        // Initialize edited rates with the original data
        const initialRates = {}
        Object.keys(data.rates_by_vehicle).forEach(vehicleType => {
          initialRates[vehicleType] = [...data.rates_by_vehicle[vehicleType]]
        })
        setEditedRates(initialRates)
      } else {
        setError('Failed to load rate card data')
      }
    } catch (err) {
      console.error('Error fetching rate card:', err)
      setError('Error loading rate card: ' + err.message)
    }
    
    setLoading(false)
  }

  const handleRateChange = (vehicleType, index, newValue) => {
    const updated = { ...editedRates }
    const rateType = updated[vehicleType][index].type
    
    // Handle different input types based on the rate type
    if (rateType === 'Standard Operating Hours') {
      // For time format, keep as string
      updated[vehicleType][index].value = newValue === '' ? null : newValue
    } else {
      // For numeric values
      if (newValue === '' || newValue === null) {
        updated[vehicleType][index].value = null
      } else {
        const parsed = parseFloat(newValue)
        updated[vehicleType][index].value = isNaN(parsed) ? null : parsed
      }
    }
    
    setEditedRates(updated)
  }

  const isRowAllNull = (index) => {
    // Check if all vehicle types have null value for this row
    return Object.keys(editedRates).every(vehicleKey => 
      editedRates[vehicleKey][index]?.value === null
    )
  }

  const isCellDisabled = (rateType, vehicleKey, rowIndex) => {
    // Disable if the entire row has all null values
    if (isRowAllNull(rowIndex)) {
      return true
    }
    
    // Disable Standard Operating Hours for cargo_van_sprinter and truck
    if (rateType === 'Standard Operating Hours') {
      return vehicleKey === 'cargo_van_sprinter' || vehicleKey === 'truck'
    }
    
    return false
  }

  const validateTimeFormat = (value) => {
    // Validate HH:MM-HH:MM format
    const timeRangeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRangeRegex.test(value)
  }

  const getInputValue = (rate) => {
    if (rate.value === null || rate.value === undefined) {
      return '—'
    }
    return String(rate.value)
  }

  const handleAIApplyChanges = (updatedRates) => {
    setEditedRates(updatedRates)
    setShowAIAssistant(false)
  }

  const handleSave = () => {
    // Validate required fields
    if (!customVendorCode || !customVendorName || !customVersionId) {
      setError('Please fill in Vendor Code, Vendor Name, and Version ID')
      return
    }

    // Validate Standard Operating Hours format before saving
    let hasError = false
    Object.keys(editedRates).forEach(vehicleKey => {
      editedRates[vehicleKey].forEach((rate, index) => {
        if (rate.type === 'Standard Operating Hours' && 
            rate.value !== null && 
            !isCellDisabled(rate.type, vehicleKey, index)) {
          if (!validateTimeFormat(rate.value)) {
            setError('Invalid time format for Standard Operating Hours. Use HH:MM-HH:MM format (e.g., 08:00-17:00)')
            hasError = true
          }
        }
      })
    })

    if (!hasError) {
      // Prepare custom rules data to send to backend
      const customRulesData = {
        vendor_code: customVendorCode,
        vendor_name: customVendorName,
        version_id: customVersionId,
        rates_by_vehicle: editedRates,
        vehicle_types: rateCardData.vehicle_types
      }
      
      onSave(customRulesData)
      onClose()
    }
  }

  if (!show) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content custom-rules-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Custom Rate Card Rules</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="error-state">⚠ {error}</div>
            )}

            {loading && (
              <div className="loading-state">Loading rate card data...</div>
            )}

            {rateCardData && !loading && (
              <>
                {/* AI Assistant Button */}
                <div className="ai-assistant-trigger">
                  <button 
                    className="button ai-button"
                    onClick={() => setShowAIAssistant(true)}
                  >
                    ✨ Describe your rules and let AI update the rates for you
                  </button>
                </div>

                {/* Vendor and Version Editor */}
                <div className="vendor-version-editor">
                  <div className="input-group">
                    <label>Vendor Code:</label>
                    <input
                      type="text"
                      value={customVendorCode}
                      onChange={(e) => setCustomVendorCode(e.target.value)}
                      className="vendor-input"
                      placeholder="Enter vendor code"
                    />
                  </div>
                  <div className="input-group">
                    <label>Vendor Name:</label>
                    <input
                      type="text"
                      value={customVendorName}
                      onChange={(e) => setCustomVendorName(e.target.value)}
                      className="vendor-input"
                      placeholder="Enter vendor name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Version ID:</label>
                    <input
                      type="text"
                      value={customVersionId}
                      onChange={(e) => setCustomVersionId(e.target.value)}
                      className="version-input"
                      placeholder="Enter version ID"
                    />
                  </div>
                </div>

                <div className="rates-table-container">
                  <table className="rates-edit-table">
                    <thead>
                      <tr>
                        <th className="type-column">TYPE</th>
                        <th className="description-column">DESCRIPTION</th>
                        {Object.entries(rateCardData.vehicle_types).map(([key, vehicle]) => (
                          <th key={key} className="vehicle-column">{vehicle.name.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {editedRates[Object.keys(editedRates)[0]]?.map((_, index) => {
                        const rateType = editedRates[Object.keys(editedRates)[0]][index].type
                        const description = editedRates[Object.keys(editedRates)[0]][index].description
                        const rowAllNull = isRowAllNull(index)
                        
                        return (
                          <tr key={index} className={rowAllNull ? 'disabled-row' : ''}>
                            <td className="type-cell">{rateType}</td>
                            <td className="description-cell">{description}</td>
                            {Object.keys(rateCardData.vehicle_types).map((vehicleKey) => {
                              const rate = editedRates[vehicleKey][index]
                              const isDisabled = isCellDisabled(rateType, vehicleKey, index)
                              const isTimeField = rateType === 'Standard Operating Hours'
                              
                              return (
                                <td key={vehicleKey} className="value-cell">
                                  <input
                                    type="text"
                                    value={getInputValue(rate)}
                                    onChange={(e) => handleRateChange(vehicleKey, index, e.target.value)}
                                    className={`rate-input ${isDisabled ? 'disabled' : ''} ${isTimeField ? 'time-input' : ''}`}
                                    disabled={isDisabled}
                                    placeholder={isTimeField && !isDisabled ? 'HH:MM-HH:MM' : ''}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="button" 
              onClick={handleSave}
              disabled={loading || !rateCardData}
            >
              Apply Custom Rules
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal - Render outside the main modal */}
      {showAIAssistant && (
        <AIRatesAssistant
          show={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          rateCardData={rateCardData}
          onApplyChanges={handleAIApplyChanges}
        />
      )}
    </>
  )
}

export default CustomRulesModal
