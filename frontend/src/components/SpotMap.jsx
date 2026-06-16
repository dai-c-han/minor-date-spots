import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORY_COLORS = {
  cafe: '#8B4513', park: '#228B22', art: '#9932CC', shrine: '#FF4500',
  viewpoint: '#1E90FF', waterfall: '#00BFFF', historic: '#8B6914',
  garden: '#32CD32', other: '#808080',
}

function makeIcon(color, selected = false) {
  const size = selected ? 32 : 24
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.5}" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="${selected ? 2 : 1.5}"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.85"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size * 1.5],
    iconAnchor: [size / 2, size * 1.5],
    popupAnchor: [0, -size * 1.5],
  })
}

function MapUpdater({ center, selectedSpot }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lon], 14)
  }, [center, map])
  useEffect(() => {
    if (selectedSpot) {
      map.setView([selectedSpot.lat, selectedSpot.lon], 15, { animate: true })
    }
  }, [selectedSpot, map])
  return null
}

export default function SpotMap({ spots, center, selectedSpot, onSelectSpot }) {
  return (
    <div className="map-container">
      <MapContainer center={[center.lat, center.lon]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} selectedSpot={selectedSpot} />
        {spots.map(spot => {
          const isSelected = selectedSpot?.id === spot.id
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=walking`
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lon]}
              icon={makeIcon(CATEGORY_COLORS[spot.category] || '#808080', isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{ click: () => onSelectSpot(spot) }}
            >
              <Popup>
                <div style={{ minWidth: '160px' }}>
                  <strong style={{ fontSize: '14px' }}>{spot.name}</strong>
                  {spot.description && (
                    <p style={{ fontSize: '12px', color: '#555', margin: '6px 0' }}>{spot.description}</p>
                  )}
                  {spot.opening_hours && (
                    <p style={{ fontSize: '11px', color: '#777', margin: '4px 0' }}>🕐 {spot.opening_hours}</p>
                  )}
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block', marginTop: '8px', padding: '5px 12px',
                      background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white',
                      borderRadius: '6px', fontSize: '12px', textDecoration: 'none',
                    }}
                  >
                    🧭 ナビ開始
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
