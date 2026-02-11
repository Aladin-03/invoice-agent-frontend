import './ChargeDetailsModal.css'

function ChargeDetailsModal({ show, onClose, title, records, type }) {
  if (!show) return null

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getChargeTypeDisplay = (chargeType) => {
    if (!chargeType || chargeType === 'null' || chargeType === null) {
      return 'Not Applicable'
    }
    return chargeType.replace(/_/g, ' ').toUpperCase()
  }

  const getChargeTypeBadgeClass = (chargeType) => {
    if (!chargeType || chargeType === 'null' || chargeType === null) {
      return 'not-applicable'
    }
    return chargeType
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content charge-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="details-summary">
            <span className="summary-count">{records?.length || 0} records found</span>
          </div>

          <div className="details-table-container">
            {type === 'under_charged' && (
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Invoice Base</th>
                    <th>Rate Card Base</th>
                    <th>Difference</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {records && records.map((record, index) => (
                    <tr key={index}>
                      <td><strong>{record.order_no}</strong></td>
                      <td>{record.date}</td>
                      <td><span className="service-badge">{record.service_code}</span></td>
                      <td className="amount-cell">{formatCurrency(record.invoice_base)}</td>
                      <td className="amount-cell">{formatCurrency(record.rate_card_base)}</td>
                      <td className="difference-cell under">{formatCurrency(record.difference)}</td>
                      <td className="issue-cell">{record.issue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {type === 'over_charged' && (
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Invoice Base</th>
                    <th>Rate Card Base</th>
                    <th>Difference</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {records && records.map((record, index) => (
                    <tr key={index}>
                      <td><strong>{record.order_no}</strong></td>
                      <td>{record.date}</td>
                      <td><span className="service-badge">{record.service_code}</span></td>
                      <td className="amount-cell">{formatCurrency(record.invoice_base)}</td>
                      <td className="amount-cell">{formatCurrency(record.rate_card_base)}</td>
                      <td className="difference-cell over">{formatCurrency(record.difference)}</td>
                      <td className="issue-cell">{record.issue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {type === 'wkd_hol_ot_invalid' && (
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Validation Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records && records.map((record, index) => (
                    <tr key={index}>
                      <td><strong>{record.order_no}</strong></td>
                      <td>{record.date}</td>
                      <td><span className="service-badge">{record.service_code}</span></td>
                      <td className="amount-cell invalid">
                        {formatCurrency(record.wkd_hol_ot_amount)}
                      </td>
                      <td className="issue-cell">{record.validation_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {type === 'wkd_hol_ot_valid' && (
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Charge Type</th>
                    <th>Amount</th>
                    <th>Validation Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records && records.map((record, index) => (
                    <tr key={index}>
                      <td><strong>{record.order_no}</strong></td>
                      <td>{record.date}</td>
                      <td><span className="service-badge">{record.service_code}</span></td>
                      <td>
                        <span className={`charge-type-badge ${getChargeTypeBadgeClass(record.charge_type)}`}>
                          {getChargeTypeDisplay(record.charge_type)}
                        </span>
                      </td>
                      <td className="amount-cell valid">
                        {formatCurrency(record.wkd_hol_ot_amount)}
                      </td>
                      <td className="issue-cell">{record.validation_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChargeDetailsModal
