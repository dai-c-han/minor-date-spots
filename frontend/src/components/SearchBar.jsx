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
  const [gpsLoading, setGpsLoading] = useState(false)

  const toggleCat = (id) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const doSearch = async (params) => {
    setLoading(true)
    try {
      const res = await api.post('/api/search', { ...params, radius, categories: selectedCats })
      onResult(res.data)
    } catch (e) {
      alert('検索エラー: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    doSearch({ query })
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('このブラウザは位置情報に対応していません')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        setQuery('現在地')
        doSearch({ query: '現在地', lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        setGpsLoading(false)
        alert('位置情報の取得に失敗しました: ' + err.message)
      },
      { timeout: 10000 }
    )
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
        <button onClick={handleGPS} disabled={loading || gpsLoading} className="gps-btn" title="現在地で検索">
          {gpsLoading ? '📡' : '📍'}
        </button>
        <button onClick={handleSearch} disabled={loading || gpsLoading} className="search-btn">
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
