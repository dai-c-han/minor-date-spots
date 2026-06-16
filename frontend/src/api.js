const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

const CATEGORY_TAGS = {
  cafe:      '[amenity=cafe]',
  park:      '[leisure=park]',
  art:       '[tourism=gallery]',
  museum:    '[tourism=museum]',
  shrine:    '[amenity=place_of_worship]',
  viewpoint: '[tourism=viewpoint]',
  waterfall: '[waterway=waterfall]',
  historic:  '[historic]',
  garden:    '[leisure=garden]',
}

export async function geocode(query) {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=jp`,
    { headers: { 'User-Agent': 'DateSpotApp/1.0' } }
  )
  const data = await res.json()
  if (!data.length) throw new Error('場所が見つかりませんでした')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

function buildOverpassQuery(lat, lon, radius, categories) {
  const cats = categories.length ? categories : Object.keys(CATEGORY_TAGS)
  const parts = cats.flatMap(cat => {
    const tag = CATEGORY_TAGS[cat]
    if (!tag) return []
    return [
      `node${tag}(around:${radius},${lat},${lon});`,
      `way${tag}(around:${radius},${lat},${lon});`,
    ]
  })
  return `[out:json][timeout:30];\n(\n${parts.join('\n')}\n);\nout center 50;`
}

function detectCategory(tags) {
  if (tags.amenity === 'cafe') return 'cafe'
  if (tags.leisure === 'park') return 'park'
  if (tags.tourism === 'gallery') return 'art'
  if (tags.tourism === 'museum') return 'art'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.waterway === 'waterfall') return 'waterfall'
  if (tags.historic) return 'historic'
  if (tags.leisure === 'garden') return 'garden'
  if (tags.amenity === 'place_of_worship') return 'shrine'
  return 'other'
}

export async function searchSpots({ lat, lon, radius, categories }) {
  const query = buildOverpassQuery(lat, lon, radius, categories)
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const data = await res.json()

  const spots = data.elements
    .map(elem => {
      const tags = elem.tags || {}
      const name = tags.name || tags['name:ja']
      if (!name) return null
      const lat = elem.type === 'way' ? elem.center?.lat : elem.lat
      const lon = elem.type === 'way' ? elem.center?.lon : elem.lon
      if (!lat || !lon) return null
      return {
        id: String(elem.id),
        name,
        lat,
        lon,
        tags,
        category: detectCategory(tags),
        description: tags.description || tags['description:ja'] || '',
        website: tags.website || tags.url || '',
        opening_hours: tags.opening_hours || '',
        minor_score: Math.max(0, 100 - Object.keys(tags).length * 5),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.minor_score - a.minor_score)

  return spots
}

export async function aiSuggest({ area, categories }) {
  const res = await fetch('/api/ai-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ area, categories }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'AI提案に失敗しました')
  }
  return res.json()
}
