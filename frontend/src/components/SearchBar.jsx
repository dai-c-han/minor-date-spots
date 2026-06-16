import { useState } from 'react'
import { api } from '../api'

const CATEGORIES = [
  { id: 'cafe', label: '☕ カフェ' },
  { id: 'park', label: '🌳 公園' },
  { id: 'art', label: '🎨 美術館・ギャラリー' },
  { id: 'shrine', label: '⛩️ 神社・寺' },
  { id: 'viewpoint', label: '🔭 展望台' },
  { id: 'waterfall', label: '💧 滝' },
  { id: 'historic', label: '🏯 歴史的建造物' },
  { id: 'garden', label: '🌸 庭園' },
]

export default function SearchBar({ onResult, setLoading, loading }) {
  const [query, setQuery] = useState('')
  const [radius, setRadius] = useState(2000)
  const [selectedCats, setSelectedCats] = useState([])

  const toggleCat = (id) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/search', {
        query,
        radius,
        categories: selectedCats,
      })
      onResult(res.data)
    } catch (e) {
      alert('検索エラー: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="searchbar">
      <div className="search-row">
        <input
          type="text"
          placeholder="エリア・駅名を入力（例：下北沢、鎌倉）"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <select
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          className="radius-select"
        >
          <option value={500}>500m</option>
          <option value={1000}>1km</option>
          <option value={2000}>2km</option>
          <option value={5000}>5km</option>
        </select>
        <button onClick={handleSearch} disabled={loading} className="search-btn">
          {loading ? '検索中...' : '🔍 検索'}
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
    </div>
  )
}
