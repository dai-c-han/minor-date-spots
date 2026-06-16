import { useState } from 'react'
import { api } from '../api'

const CATEGORIES = [
  { id: 'cafe', label: '☕ カフェ' },
  { id: 'park', label: '🌳 公園' },
  { id: 'art', label: '🎨 美術館・ギャラリー' },
  { id: 'shrine', label: '⛩️ 神社・寺' },
  { id: 'viewpoint', label: '🔭 展望台' },
  { id: 'garden', label: '🌸 庭園' },
]

const CATEGORY_EMOJI = {
  cafe: '☕', park: '🌳', art: '🎨', shrine: '⛩️',
  viewpoint: '🔭', waterfall: '💧', historic: '🏯', garden: '🌸', other: '📍',
}

export default function AISuggest() {
  const [area, setArea] = useState('')
  const [selectedCats, setSelectedCats] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleCat = (id) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleSuggest = async () => {
    if (!area.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/ai-suggest', {
        area,
        categories: selectedCats,
      })
      setSuggestions(res.data.suggestions)
    } catch (e) {
      alert('エラー: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-suggest">
      <div className="ai-desc">
        <p>AIがあなたの知らない穴場スポットを提案します。<br />
        ※ ANTHROPIC_API_KEY の設定が必要です。</p>
      </div>
      <div className="search-row">
        <input
          type="text"
          placeholder="エリアを入力（例：京都・嵐山周辺）"
          value={area}
          onChange={e => setArea(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSuggest()}
          className="search-input"
        />
        <button onClick={handleSuggest} disabled={loading} className="search-btn">
          {loading ? 'AI思考中...' : '✨ 提案してもらう'}
        </button>
      </div>
      <div className="cat-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => toggleCat(cat.id)}
            className={selectedCats.includes(cat.id) ? 'cat-btn active' : 'cat-btn'}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="ai-results">
          <h3>✨ AIからの提案</h3>
          {suggestions.map((s, i) => (
            <div key={i} className="ai-card">
              <div className="spot-header">
                <span className="spot-emoji">{CATEGORY_EMOJI[s.category] || '📍'}</span>
                <div>
                  <div className="spot-name">{s.name}</div>
                  <div className="spot-meta">{s.category}</div>
                </div>
              </div>
              <p className="spot-desc">{s.description}</p>
              <p className="why-minor">💡 {s.why_minor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
