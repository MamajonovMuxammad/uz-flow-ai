import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { embedText } from '@/lib/ai/chat-engine'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { botId } = await request.json()

        // Auth check
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify bot ownership
        const { data: bot } = await supabaseAdmin.from('bots').select('owner_id').eq('id', botId).single()
        if (!bot || bot.owner_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get docs without embeddings
        const { data: docs } = await supabaseAdmin
            .from('knowledge_base')
            .select('id, content_text')
            .eq('bot_id', botId)
            .is('embedding_vector', null)
            .limit(20)

        if (!docs?.length) {
            return NextResponse.json({ ok: true, embedded: 0, message: 'No docs to embed' })
        }

        let embedded = 0
        for (const doc of docs) {
            try {
                const embedding = await embedText(doc.content_text)
                await supabaseAdmin
                    .from('knowledge_base')
                    .update({ embedding_vector: embedding })
                    .eq('id', doc.id)
                embedded++
            } catch (err) {
                console.error('Embedding error for doc', doc.id, err)
            }
        }

        return NextResponse.json({ ok: true, embedded, total: docs.length })
    } catch (error) {
        console.error('Embed error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
