import { useState } from 'react'
import { geocode, searchSpots } from '../api'

const CATEGORIES = [
  { id: 'cafe',      label: '☕ カフェ' },
  { id: 'park',      label: '🌳 公園' },
  { id: 'art',       label: '🎨 美術館・ギャラリー' },
  { id: 'shrine',    label: '⛩️ 神社・寺' },
  { id: 'viewpoint', label: '🔭 展望台' },
  { id: 'waterfall', label: '💧 滝' },
  { id: 'historic',  label: '🏯 歴史的建造物' },
  { id: 'garden',    label: '🌸 庭園' },
]

export default function SearchBar({ onResult, loading, setLoading }) {
  const [query, setQuery]           = useState('')
  const [radius, setRadius]         = useState(2000)
  const [selectedCats, setSelectedCats] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)

  const toggleCat = (id) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const doSearch = async (lat, lon) => {
    setLoading(true)
    try {
      const spots = await searchSpots({ lat, lon, radius, categories: selectedCats })
      onResult({ spots, center: { lat, lon } })
    } catch (e) {
      alert('検索エラー: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { lat, lon } = await geocode(query)
      await doSearch(lat, lon)
    } catch (e) {
      alert('検索エラー: ' + e.message)
      setLoading(false)
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return alert('位置情報に対応していないブラウザです')
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setGpsLoading(false)
        setQuery('現在地')
        await doSearch(coords.latitude, coords.longitude)
      },
      (err) => {
        setGpsLoading(false)
        alert('位置情報の取得に失敗しました: ' + err.message)
      },
      { timeout: 10000 }
    )
  }

  const busy = loading || gpsLoading

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
        <button onClick={handleGPS} disabled={busy} className="gps-btn" title="現在地で検索">
          {gpsLoading ? '📡' : '📍'}
        </button>
        <button onClick={handleSearch} disabled={busy} className="search-btn">
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
