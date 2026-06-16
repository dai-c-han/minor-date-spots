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
  cafe: '#8B4513',
  park: '#228B22',
  art: '#9932CC',
  shrine: '#FF4500',
  viewpoint: '#1E90FF',
  waterfall: '#00BFFF',
  historic: '#8B6914',
  garden: '#32CD32',
  other: '#808080',
}

function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.85"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  })
}

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lon], 14)
  }, [center, map])
  return null
}

export default function SpotMap({ spots, center, selectedSpot, onSelectSpot }) {
  return (
    <div className="map-container">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        {spots.map(spot => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lon]}
            icon={makeIcon(CATEGORY_COLORS[spot.category] || '#808080')}
            eventHandlers={{ click: () => onSelectSpot(spot) }}
          >
            <Popup>
              <strong>{spot.name}</strong>
              <br />
              <span style={{ color: '#666', fontSize: '12px' }}>{spot.category}</span>
              {spot.description && <><br /><span style={{ fontSize: '12px' }}>{spot.description}</span></>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
