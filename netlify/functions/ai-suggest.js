const Anthropic = require('@anthropic-ai/sdk')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { area, categories = [] } = body
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY が設定されていません' }),
    }
  }

  const client = new Anthropic({ apiKey })
  const cats = categories.length ? categories.join('、') : '全般'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `あなたは日本のマイナーなデートスポットに詳しいローカルガイドです。
${area}エリアにある、観光客があまり知らないマイナーなデートスポットを5件提案してください。
カテゴリ: ${cats}

以下のJSON形式だけで返してください（説明文不要）:
[
  {
    "name": "スポット名",
    "description": "魅力の説明（100字以内）",
    "category": "cafe|park|art|shrine|viewpoint|historic|garden|other",
    "why_minor": "なぜマイナーか（50字以内）"
  }
]`,
    }],
  })

  const text = message.content[0].text
  const suggestions = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestions }),
  }
}
