import { useState } from 'react'
import SearchBar from './components/SearchBar'
import SpotMap from './components/SpotMap'
import SpotList from './components/SpotList'
import AISuggest from './components/AISuggest'
import './App.css'

export default function App() {
  const [spots, setSpots] = useState([])
  const [center, setCenter] = useState({ lat: 35.6812, lon: 139.7671 })
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [activeTab, setActiveTab] = useState('search')

  const handleSearchResult = ({ spots, center }) => {
    setSpots(spots)
    setCenter(center)
    setSelectedSpot(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🗺️ マイナーデートスポット発掘</h1>
        <p>あまり知られていない穴場スポットを見つけよう</p>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'search' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('search')}
        >
          📍 エリア検索
        </button>
        <button
          className={activeTab === 'ai' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('ai')}
        >
          ✨ AI提案
        </button>
      </div>

      <main className="main">
        {activeTab === 'search' ? (
          <>
            <SearchBar onResult={handleSearchResult} setLoading={setLoading} loading={loading} />
            <div className="content">
              <SpotMap
                spots={spots}
                center={center}
                selectedSpot={selectedSpot}
                onSelectSpot={setSelectedSpot}
              />
              <SpotList
                spots={spots}
                selectedSpot={selectedSpot}
                onSelectSpot={setSelectedSpot}
              />
            </div>
          </>
        ) : (
          <AISuggest />
        )}
      </main>
    </div>
  )
}
