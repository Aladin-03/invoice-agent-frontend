import { useState } from 'react'
import './AIRatesAssistant.css'

function AIRatesAssistant({ show, onClose, rateCardData, onApplyChanges, apiBaseUrl }) {
  const [userPrompt, setUserPrompt] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [aiResponse, setAiResponse] = useState(null)
  const [suggestedChanges, setSuggestedChanges] = useState(null)

  const handleSubmit = async () => {
    if (!userPrompt.trim()) {
      setError('Please describe what changes you want to make')
      return
    }

    setProcessing(true)
    setError(null)
    setAiResponse(null)
    setSuggestedChanges(null)

    try {
      // Prepare the prompt for the LLM
      const systemPrompt = `You are a rate card modification assistant. Given a rate card JSON structure and user instructions, you need to:
1. Understand what the user wants to change
2. Identify which specific rate values need to be modified
3. Return a JSON object with the suggested changes

The rate card structure is:
${JSON.stringify(rateCardData, null, 2)}

Return ONLY a valid JSON object in this exact format:
{
  "explanation": "Brief explanation of changes",
  "changes": [
    {
      "vehicle_type": "cargo_van_sprinter",
      "rate_type": "Base Rate",
      "current_value": 65,
      "new_value": 75,
      "reason": "Increased base rate as requested"
    }
  ]
}

Important rules:
- vehicle_type must be one of: cargo_van_sprinter, car_suv_minivan, truck
- rate_type must match exactly the type names in the rate card
- Only suggest changes that make logical sense
- Keep numeric values reasonable
- For time formats (Standard Operating Hours), use HH:MM-HH:MM format`

      const userMessage = `User request: ${userPrompt}

Please analyze the rate card and suggest specific changes based on this request.`

      // Call OpenAI API with GPT-4o mini
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: "json_object" } // Force JSON response
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to get AI response')
      }

      const data = await response.json()
      const aiContent = data.choices[0].message.content

      // Parse the AI response
      const parsedResponse = JSON.parse(aiContent)
      setAiResponse(parsedResponse.explanation)
      setSuggestedChanges(parsedResponse.changes || [])

    } catch (err) {
      console.error('Error getting AI suggestions:', err)
      setError('Failed to get AI suggestions: ' + err.message)
    }

    setProcessing(false)
  }

  const handleApplyChanges = () => {
    if (!suggestedChanges || suggestedChanges.length === 0) {
      return
    }

    // Apply the suggested changes to the rate card data
    const updatedRates = JSON.parse(JSON.stringify(rateCardData.rates_by_vehicle))

    suggestedChanges.forEach(change => {
      const vehicleRates = updatedRates[change.vehicle_type]
      if (vehicleRates) {
        const rateIndex = vehicleRates.findIndex(r => r.type === change.rate_type)
        if (rateIndex !== -1) {
          vehicleRates[rateIndex].value = change.new_value
        }
      }
    })

    onApplyChanges(updatedRates)
    onClose()
  }

  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ AI Rate Card Assistant</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="ai-prompt-section">
            <label htmlFor="ai-prompt">Describe the changes you want to make:</label>
            <textarea
              id="ai-prompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Example: Increase all base rates by 10%, Set car standard operating hours to 09:00-18:00, Add $5 to weekend surcharge for cargo vans..."
              rows={6}
              className="ai-prompt-input"
              disabled={processing}
            />
            
            <button
              className="button"
              onClick={handleSubmit}
              disabled={processing || !userPrompt.trim()}
            >
              {processing ? 'Analyzing...' : '✨ Generate Suggestions'}
            </button>
          </div>

          {error && (
            <div className="error-state">⚠ {error}</div>
          )}

          {aiResponse && (
            <div className="ai-response-section">
              <h3>AI Analysis:</h3>
              <div className="ai-explanation">
                {aiResponse}
              </div>
            </div>
          )}

          {suggestedChanges && suggestedChanges.length > 0 && (
            <div className="suggested-changes-section">
              <h3>Suggested Changes ({suggestedChanges.length}):</h3>
              <div className="changes-list">
                {suggestedChanges.map((change, index) => (
                  <div key={index} className="change-item">
                    <div className="change-header">
                      <span className="vehicle-badge">
                        {change.vehicle_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="rate-type">{change.rate_type}</span>
                    </div>
                    <div className="change-values">
                      <span className="old-value">{change.current_value ?? '—'}</span>
                      <span className="arrow">→</span>
                      <span className="new-value">{change.new_value}</span>
                    </div>
                    <div className="change-reason">{change.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button"
            onClick={handleApplyChanges}
            disabled={!suggestedChanges || suggestedChanges.length === 0}
          >
            Apply AI Suggestions
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIRatesAssistant
