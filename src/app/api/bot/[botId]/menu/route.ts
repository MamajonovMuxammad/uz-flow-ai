import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — получить все кнопки бота
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { data, error } = await supabase
        .from('bot_menu_buttons')
        .select('*')
        .eq('bot_id', botId)
        .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// POST — сохранить все кнопки (полная перезапись)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { buttons } = await request.json()

    if (!Array.isArray(buttons)) {
        return NextResponse.json({ error: 'buttons must be array' }, { status: 400 })
    }

    // Удалить старые
    await supabase.from('bot_menu_buttons').delete().eq('bot_id', botId)

    // Вставить новые
    if (buttons.length > 0) {
        const rows = buttons.map((b: any, i: number) => ({
            bot_id: botId,
            label: b.label,
            emoji: b.emoji || '📌',
            action: b.action || 'text',
            action_value: b.action_value || '',
            sort_order: i,
            is_active: b.is_active !== false,
        }))

        const { error } = await supabase.from('bot_menu_buttons').insert(rows)
        if (error) {
            console.error('Insert menu error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    return NextResponse.json({ ok: true, count: buttons.length })
}

// DELETE — удалить одну кнопку
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    const { botId } = await params
    const { buttonId } = await request.json()
    const { error } = await supabase.from('bot_menu_buttons').delete().eq('id', buttonId).eq('bot_id', botId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
