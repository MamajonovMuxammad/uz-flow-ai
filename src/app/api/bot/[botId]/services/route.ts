import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — получить все услуги бота
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { data, error } = await supabase
        .from('bot_services')
        .select('*')
        .eq('bot_id', botId)
        .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// POST — сохранить все услуги (полная перезапись)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { services } = await request.json()

    if (!Array.isArray(services)) {
        return NextResponse.json({ error: 'services must be array' }, { status: 400 })
    }

    // Удалить старые
    await supabase.from('bot_services').delete().eq('bot_id', botId)

    // Вставить новые
    if (services.length > 0) {
        const rows = services.map((s: any, i: number) => ({
            bot_id: botId,
            name: s.name,
            description: s.description || '',
            price: s.price || 0,
            duration_minutes: s.duration_minutes || 60,
            is_active: s.is_active !== false,
            sort_order: i,
        }))

        const { error } = await supabase.from('bot_services').insert(rows)
        if (error) {
            console.error('Insert services error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    return NextResponse.json({ ok: true, count: services.length })
}

// DELETE — удалить одну услугу
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { serviceId } = await request.json()
    const { error } = await supabase.from('bot_services').delete().eq('id', serviceId).eq('bot_id', botId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
