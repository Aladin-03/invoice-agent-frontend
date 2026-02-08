import { formatDateTime } from '../utils/api'

function RatesModal({ show, onClose, versionData }) {
  if (!show || !versionData) return null

  // Transform the data structure to combine all vehicle rates
  const transformRatesData = () => {
    const rateTypes = new Set()
    const transformedData = []

    // Collect all unique rate types
    Object.values(versionData.rates_by_vehicle).forEach(rates => {
      rates.forEach(rate => rateTypes.add(rate.type))
    })

    // Create combined data structure
    Array.from(rateTypes).forEach(type => {
      const row = {
        type,
        description: '',
        values: {}
      }

      Object.entries(versionData.rates_by_vehicle).forEach(([vehicleKey, rates]) => {
        const rateData = rates.find(r => r.type === type)
        if (rateData) {
          row.description = rateData.description
          row.values[vehicleKey] = rateData.value
        } else {
          row.values[vehicleKey] = null
        }
      })

      transformedData.push(row)
    })

    return transformedData
  }

  const combinedRates = transformRatesData()
  const vehicleKeys = Object.keys(versionData.rates_by_vehicle)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate Card: {versionData.vendor_name}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Version Info */}
          <div className="info-section">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Version ID:</span>
                <span className="info-value">{versionData.version_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Uploaded At:</span>
                <span className="info-value">{formatDateTime(versionData.uploaded_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vendor Code:</span>
                <span className="info-value">{versionData.vendor_code}</span>
              </div>
            </div>

            {/* <div className="vehicle-types-section">
              <strong>Vehicle Types:</strong>
              <div className="vehicle-types">
                {Object.entries(versionData.vehicle_types).map(([key, vehicle]) => (
                  <div key={key} className="badge">
                    {vehicle.name}
                  </div>
                ))}
              </div>
            </div> */}
          </div>

          {/* Combined Rates Table */}
          <div className="rates-section">
            <h3>All Vehicle Rates</h3>
            <div className="rates-table-container">
              <table className="rates-table rates-table-combined">
                <thead>
                  <tr>
                    <th className="sticky-col">Type</th>
                    <th className="description-col">Description</th>
                    {vehicleKeys.map(vehicleKey => (
                      <th key={vehicleKey} className="vehicle-col">
                        {versionData.vehicle_types[vehicleKey]?.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {combinedRates.map((rate, index) => (
                    <tr key={index}>
                      <td className="sticky-col"><strong>{rate.type}</strong></td>
                      <td className="description-col" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {rate.description}
                      </td>
                      {vehicleKeys.map(vehicleKey => (
                        <td key={vehicleKey} className="vehicle-col">
                          {rate.values[vehicleKey] !== null ? (
                            <span className="rate-value">{rate.values[vehicleKey]}</span>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RatesModal
