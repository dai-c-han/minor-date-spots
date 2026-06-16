from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import anthropic
import json

load_dotenv()

app = FastAPI()

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

CATEGORY_TAGS = {
    "cafe": '[amenity=cafe]',
    "park": '[leisure=park]',
    "art": '[tourism=gallery][tourism=museum]',
    "shrine": '[historic=wayside_shrine][amenity=place_of_worship][religion=shinto]',
    "viewpoint": '[tourism=viewpoint]',
    "waterfall": '[waterway=waterfall]',
    "historic": '[historic]',
    "garden": '[leisure=garden]',
}

class SearchRequest(BaseModel):
    query: str
    lat: float | None = None
    lon: float | None = None
    radius: int = 2000
    categories: list[str] = []

class AIRequest(BaseModel):
    area: str
    categories: list[str] = []

async def geocode_query(query: str) -> tuple[float, float] | None:
    url = f"https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "jp",
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params, headers={"User-Agent": "DateSpotApp/1.0"})
        data = r.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    return None

def build_overpass_query(lat: float, lon: float, radius: int, categories: list[str]) -> str:
    if not categories:
        categories = list(CATEGORY_TAGS.keys())

    parts = []
    for cat in categories:
        if cat in CATEGORY_TAGS:
            tag = CATEGORY_TAGS[cat]
            # handle multiple tags like art category
            for t in tag.split('][tourism='):
                if t.startswith('['):
                    parts.append(f'node{t}(around:{radius},{lat},{lon});')
                    parts.append(f'way{t}(around:{radius},{lat},{lon});')
                else:
                    parts.append(f'node[tourism={t}](around:{radius},{lat},{lon});')
                    parts.append(f'way[tourism={t}](around:{radius},{lat},{lon});')

    query = f"""
[out:json][timeout:30];
(
  {''.join(parts)}
);
out center 50;
"""
    return query

def parse_overpass_results(data: dict) -> list[dict]:
    spots = []
    for elem in data.get("elements", []):
        tags = elem.get("tags", {})
        name = tags.get("name") or tags.get("name:ja")
        if not name:
            continue

        if elem.get("type") == "way":
            center = elem.get("center", {})
            lat = center.get("lat")
            lon = center.get("lon")
        else:
            lat = elem.get("lat")
            lon = elem.get("lon")

        if not lat or not lon:
            continue

        spots.append({
            "id": str(elem.get("id")),
            "name": name,
            "lat": lat,
            "lon": lon,
            "tags": tags,
            "category": detect_category(tags),
            "description": tags.get("description") or tags.get("description:ja") or "",
            "website": tags.get("website") or tags.get("url") or "",
            "opening_hours": tags.get("opening_hours") or "",
        })
    return spots

def detect_category(tags: dict) -> str:
    amenity = tags.get("amenity", "")
    leisure = tags.get("leisure", "")
    tourism = tags.get("tourism", "")
    historic = tags.get("historic", "")
    waterway = tags.get("waterway", "")

    if amenity == "cafe":
        return "cafe"
    if leisure == "park":
        return "park"
    if tourism in ("gallery", "museum"):
        return "art"
    if tourism == "viewpoint":
        return "viewpoint"
    if waterway == "waterfall":
        return "waterfall"
    if historic:
        return "historic"
    if leisure == "garden":
        return "garden"
    if amenity == "place_of_worship":
        return "shrine"
    return "other"

@app.post("/api/search")
async def search_spots(req: SearchRequest):
    lat, lon = req.lat, req.lon

    if not lat or not lon:
        coords = await geocode_query(req.query)
        if not coords:
            raise HTTPException(status_code=404, detail="場所が見つかりませんでした")
        lat, lon = coords

    query = build_overpass_query(lat, lon, req.radius, req.categories)
    async with httpx.AsyncClient(timeout=35) as client:
        r = await client.post(OVERPASS_URL, data={"data": query})
        data = r.json()

    spots = parse_overpass_results(data)

    # マイナー度スコア（レビュー数が少ない＝タグが少ない）
    for spot in spots:
        tag_count = len(spot["tags"])
        spot["minor_score"] = max(0, 100 - tag_count * 5)

    spots.sort(key=lambda x: x["minor_score"], reverse=True)

    return {"spots": spots, "center": {"lat": lat, "lon": lon}}

@app.post("/api/ai-suggest")
async def ai_suggest(req: AIRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY が設定されていません")

    client = anthropic.Anthropic(api_key=api_key)
    cats = "、".join(req.categories) if req.categories else "全般"
    prompt = f"""あなたは日本のマイナーなデートスポットに詳しいローカルガイドです。
{req.area}エリアにある、観光客があまり知らないマイナーなデートスポットを5件提案してください。
カテゴリ: {cats}

以下のJSON形式で返してください（他のテキストは不要）:
[
  {{
    "name": "スポット名",
    "description": "魅力の説明（100字以内）",
    "category": "cafe|park|art|shrine|viewpoint|historic|garden|other",
    "why_minor": "なぜマイナーか（50字以内）"
  }}
]"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        text = message.content[0].text
        start = text.find("[")
        end = text.rfind("]") + 1
        suggestions = json.loads(text[start:end])
    except Exception:
        raise HTTPException(status_code=500, detail="AIの応答を解析できませんでした")

    return {"suggestions": suggestions}
