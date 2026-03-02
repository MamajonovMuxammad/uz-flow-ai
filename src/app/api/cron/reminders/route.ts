import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
    if (!supabaseUrl.startsWith('http') || supabaseKey.length < 20) return null
    return createClient(supabaseUrl, supabaseKey)
}

function parseLocaleDate(dateStr: string, timeStr: string) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:mm:ss" or "HH:mm"
    // Assuming timezone offset is +05:00 for Uzbekistan
    return new Date(`${dateStr}T${timeStr.slice(0, 5)}:00+05:00`)
}

async function sendTelegramMessage(token: string, chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    }).catch(() => { })
}

export async function GET(req: Request) {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'No db' }, { status: 500 })

    const { url } = req
    const { searchParams } = new URL(url)
    const auth = searchParams.get('secret') || req.headers.get('Authorization')

    // Simple protection
    if (auth !== process.env.WEBHOOK_SECRET && auth !== 'Bearer ' + process.env.WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const nowUZ = new Date()
        // We only care about bookings today and tomorrow
        const todayStr = new Date(nowUZ.getTime() + 5 * 3600 * 1000).toISOString().split('T')[0]
        const tmrwStr = new Date(nowUZ.getTime() + 29 * 3600 * 1000).toISOString().split('T')[0]

        // Fetch pending/confirmed bookings for today and tomorrow
        const { data: bookings } = await supabase
            .from('bookings')
            .select('*, bots(bot_token, language)')
            .in('status', ['pending', 'confirmed'])
            .in('booking_date', [todayStr, tmrwStr])

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ ok: true, message: 'No upcoming bookings' })
        }

        let sentCount = 0

        for (const b of bookings) {
            if (!b.bots || !b.bots.bot_token || !b.telegram_id) continue

            const bookingDateMs = parseLocaleDate(b.booking_date, b.booking_time).getTime()
            const nowMs = new Date().getTime()

            // Minutes until booking
            const diffMinutes = (bookingDateMs - nowMs) / (1000 * 60)

            const notes = b.notes || ""
            let shouldUpdate = false
            let newNotes = notes
            let msgText = ""

            const lang = b.bots.language || 'uz'

            // --- 6 HOURS REMINDER ---
            if (diffMinutes > 300 && diffMinutes <= 390 && !notes.includes('[REMIND_6H]')) {
                newNotes += " [REMIND_6H]"
                shouldUpdate = true
                if (lang === 'ru') {
                    msgText = `⏰ <b>Напоминание о записи!</b>\n\nЗдравствуйте, ${b.customer_name}!\nНапоминаем, что вы записаны на <b>${b.service_name}</b> сегодня в ${b.booking_time.slice(0, 5)}.\n\nЖдём вас через 6 часов! 🤝`
                } else {
                    msgText = `⏰ <b>Yozilish eslatmasi!</b>\n\nAssalomu alaykum, ${b.customer_name}!\nSiz bugun soat ${b.booking_time.slice(0, 5)} da <b>${b.service_name}</b> xizmatiga yozilgansiz.\n\nSizni 6 soatdan so'ng kutamiz! 🤝`
                }
            }
            // --- 2 HOURS REMINDER ---
            else if (diffMinutes > 60 && diffMinutes <= 150 && !notes.includes('[REMIND_2H]')) {
                newNotes += " [REMIND_2H]"
                shouldUpdate = true
                if (lang === 'ru') {
                    msgText = `⏰ <b>Внимание: Запись через 2 часа!</b>\n\nУважаемый(ая) ${b.customer_name},\nВаша запись на <b>${b.service_name}</b> начнется в ${b.booking_time.slice(0, 5)}.\n\nПожалуйста, не опаздывайте. До скорой встречи! ⭐`
                } else {
                    msgText = `⏰ <b>Diqqat: Yozilishga 2 soat qoldi!</b>\n\nHurmatli ${b.customer_name},\nSizning <b>${b.service_name}</b> xizmatiga yozilishingiz soat ${b.booking_time.slice(0, 5)} da boshlanadi.\n\nIltimos, kechikmang. Tez orada ko'rishguncha! ⭐`
                }
            }

            if (shouldUpdate && msgText) {
                // Send telegram msg
                await sendTelegramMessage(b.bots.bot_token, b.telegram_id, msgText)

                // Save database flag
                await supabase.from('bookings').update({ notes: newNotes.trim() }).eq('id', b.id)
                sentCount++
            }
        }

        return NextResponse.json({ ok: true, sent: sentCount })

    } catch (error: any) {
        console.error('CRON ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
