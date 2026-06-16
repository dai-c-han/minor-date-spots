const CATEGORY_EMOJI = {
  cafe: '☕', park: '🌳', art: '🎨', shrine: '⛩️',
  viewpoint: '🔭', waterfall: '💧', historic: '🏯', garden: '🌸', other: '📍',
}

const CATEGORY_LABEL = {
  cafe: 'カフェ', park: '公園', art: '美術館・ギャラリー', shrine: '神社・寺',
  viewpoint: '展望台', waterfall: '滝', historic: '歴史的建造物', garden: '庭園', other: 'その他',
}

function navUrl(spot) {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=walking`
}

function googleMapsUrl(spot) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name)}&query_place=${spot.lat},${spot.lon}`
}

export default function SpotList({ spots, selectedSpot, onSelectSpot }) {
  if (spots.length === 0) {
    return (
      <div className="spot-list empty">
        <p>エリアを入力して検索してください</p>
      </div>
    )
  }

  return (
    <div className="spot-list">
      <h3>{spots.length}件のスポット</h3>
      {spots.map(spot => {
        const isSelected = selectedSpot?.id === spot.id
        return (
          <div
            key={spot.id}
            className={isSelected ? 'spot-card selected' : 'spot-card'}
            onClick={() => onSelectSpot(spot)}
          >
            <div className="spot-header">
              <span className="spot-emoji">{CATEGORY_EMOJI[spot.category] || '📍'}</span>
              <div>
                <div className="spot-name">{spot.name}</div>
                <div className="spot-meta">{CATEGORY_LABEL[spot.category] || spot.category}</div>
              </div>
              <div className="minor-badge">穴場 {spot.minor_score}</div>
            </div>

            {isSelected && (
              <div className="spot-detail">
                {spot.description ? (
                  <p className="spot-desc">{spot.description}</p>
                ) : (
                  <p className="spot-desc no-desc">OpenStreetMapに登録された{CATEGORY_LABEL[spot.category] || 'スポット'}です。</p>
                )}
                {spot.opening_hours && (
                  <p className="spot-hours">🕐 {spot.opening_hours}</p>
                )}
                {spot.website && (
                  <a href={spot.website} target="_blank" rel="noopener noreferrer" className="spot-link">
                    🌐 Webサイト
                  </a>
                )}
                <div className="spot-actions">
                  <a
                    href={navUrl(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-btn"
                    onClick={e => e.stopPropagation()}
                  >
                    🧭 ナビ開始
                  </a>
                  <a
                    href={googleMapsUrl(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn"
                    onClick={e => e.stopPropagation()}
                  >
                    🗺️ Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
