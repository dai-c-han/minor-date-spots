import Anthropic from '@anthropic-ai/sdk'

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { area, categories = [] } = await req.json()
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 })
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

以下のJSON形式で返してください（他のテキストは不要）:
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

  return Response.json({ suggestions })
}

export const config = { path: '/api/ai-suggest' }
