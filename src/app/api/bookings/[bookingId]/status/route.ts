import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendTelegramNotification(token: string, chatId: number, text: string) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    return res.json()
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    const { bookingId } = await params
    const { status, reason } = await request.json()

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get booking with bot info
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('*, bot_id')
        .eq('id', bookingId)
        .single()

    if (error || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get bot token
    const { data: bot } = await supabase
        .from('bots')
        .select('bot_token, language')
        .eq('id', booking.bot_id)
        .single()

    // Update booking
    const updateData: any = { status }
    if (reason) updateData.rejection_reason = reason

    const { error: updateError } = await supabase.from('bookings').update(updateData).eq('id', bookingId)
    if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    // Send Telegram notification to client
    if (bot?.bot_token && booking.telegram_id) {
        const lang = bot.language === 'ru' ? 'ru' : 'uz'
        let message = ''

        if (status === 'confirmed') {
            message = lang === 'ru'
                ? `✅ <b>Ваша запись подтверждена!</b>\n\n📋 Услуга: ${booking.service_name}\n📅 Дата: ${booking.booking_date}\n🕐 Время: ${booking.booking_time?.slice(0, 5)}\n\nЖдём вас! 🤝`
                : `✅ <b>Yozilishingiz tasdiqlandi!</b>\n\n📋 Xizmat: ${booking.service_name}\n📅 Sana: ${booking.booking_date}\n🕐 Vaqt: ${booking.booking_time?.slice(0, 5)}\n\nSizni kutamiz! 🤝`
        } else if (status === 'cancelled') {
            const reasonText = reason || (lang === 'ru' ? 'Не указана' : 'Ko\'rsatilmagan')
            message = lang === 'ru'
                ? `❌ <b>Ваша запись отклонена</b>\n\n📋 Услуга: ${booking.service_name}\n📅 Дата: ${booking.booking_date}\n🕐 Время: ${booking.booking_time?.slice(0, 5)}\n\n📝 Причина: <i>${reasonText}</i>\n\nВы можете записаться на другое время! /start`
                : `❌ <b>Yozilishingiz rad etildi</b>\n\n📋 Xizmat: ${booking.service_name}\n📅 Sana: ${booking.booking_date}\n🕐 Vaqt: ${booking.booking_time?.slice(0, 5)}\n\n📝 Sabab: <i>${reasonText}</i>\n\nBoshqa vaqtga yozilishingiz mumkin! /start`
        } else if (status === 'completed') {
            message = lang === 'ru'
                ? `🎉 <b>Визит завершён!</b>\n\n📋 ${booking.service_name}\n\nСпасибо что были у нас! Будем рады видеть вас снова! ⭐`
                : `🎉 <b>Tashrif yakunlandi!</b>\n\n📋 ${booking.service_name}\n\nBizda bo'lganingiz uchun rahmat! Yana kutamiz! ⭐`
        }

        if (message) {
            await sendTelegramNotification(bot.bot_token, booking.telegram_id, message)
        }
    }

    return NextResponse.json({ ok: true })
}
