const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// カテゴリごとに個別のクエリに分けてシンプルに保つ
const CATEGORY_TAGS = {
  cafe:      'amenity=cafe',
  park:      'leisure=park',
  art:       'tourism=gallery',
  museum:    'tourism=museum',
  shrine:    'amenity=place_of_worship',
  viewpoint: 'tourism=viewpoint',
  waterfall: 'waterway=waterfall',
  historic:  'historic=ruins',
  garden:    'leisure=garden',
}

// カテゴリ未選択時はメジャーな5つに絞る（クエリを軽量に）
const DEFAULT_CATS = ['cafe', 'park', 'art', 'shrine', 'garden']

export async function geocode(query) {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=jp`,
    { headers: { 'Accept-Language': 'ja', 'User-Agent': 'DateSpotApp/1.0' } }
  )
  const data = await res.json()
  if (!data.length) throw new Error('場所が見つかりませんでした')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

function buildOverpassQuery(lat, lon, radius, categories) {
  const cats = categories.length ? categories : DEFAULT_CATS
  const parts = cats.flatMap(cat => {
    const tag = CATEGORY_TAGS[cat]
    if (!tag) return []
    return [
      `node[${tag}](around:${radius},${lat},${lon});`,
      `way[${tag}](around:${radius},${lat},${lon});`,
    ]
  })
  return `[out:json][timeout:25];\n(\n${parts.join('\n')}\n);\nout center 40;`
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

async function fetchJSON(url, options) {
  const res = await fetch(url, options)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.error('Non-JSON response:', text.slice(0, 200))
    throw new Error('検索サービスが一時的に利用できません。しばらく待ってから再試行してください。')
  }
}

export async function searchSpots({ lat, lon, radius, categories }) {
  const query = buildOverpassQuery(lat, lon, radius, categories)
  // GETリクエストはCORSプリフライト不要で安定
  const data = await fetchJSON(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`)

  if (!data.elements) throw new Error('検索結果を取得できませんでした')

  return data.elements
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
}

export async function aiSuggest({ area, categories }) {
  const res = await fetch('/api/ai-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ area, categories }),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error('AI応答の解析に失敗しました') }
  if (!res.ok) throw new Error(data.error || 'AI提案に失敗しました')
  return data
}
