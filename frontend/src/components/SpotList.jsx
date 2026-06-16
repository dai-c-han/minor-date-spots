const CATEGORY_EMOJI = {
  cafe: '☕',
  park: '🌳',
  art: '🎨',
  shrine: '⛩️',
  viewpoint: '🔭',
  waterfall: '💧',
  historic: '🏯',
  garden: '🌸',
  other: '📍',
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
      {spots.map(spot => (
        <div
          key={spot.id}
          className={selectedSpot?.id === spot.id ? 'spot-card selected' : 'spot-card'}
          onClick={() => onSelectSpot(spot)}
        >
          <div className="spot-header">
            <span className="spot-emoji">{CATEGORY_EMOJI[spot.category] || '📍'}</span>
            <div>
              <div className="spot-name">{spot.name}</div>
              <div className="spot-meta">{spot.category}</div>
            </div>
            <div className="minor-badge" title="穴場スコア">
              穴場 {spot.minor_score}
            </div>
          </div>
          {spot.description && (
            <p className="spot-desc">{spot.description}</p>
          )}
          {spot.opening_hours && (
            <p className="spot-hours">🕐 {spot.opening_hours}</p>
          )}
          {spot.website && (
            <a href={spot.website} target="_blank" rel="noopener noreferrer" className="spot-link">
              Webサイト →
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
