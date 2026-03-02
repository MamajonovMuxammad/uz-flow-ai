import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
    if (!supabaseUrl.startsWith('http') || supabaseKey.length < 20) return null
    return createClient(supabaseUrl, supabaseKey)
}

// ===== TELEGRAM HELPERS =====
async function sendMessage(token: string, chatId: number, text: string, extra: Record<string, unknown> = {}) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
    })
    const r = await res.json()
    if (!r.ok) console.error('[TG ERROR]', r.description)
    return r
}

async function answerCallback(token: string, callbackId: string, text = '') {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId, text }),
    })
}

async function editMessage(token: string, chatId: number, messageId: number, text: string, extra: Record<string, unknown> = {}) {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra }),
    })
}

function detectLang(text: string): 'uz' | 'ru' {
    return /[а-яёА-ЯЁ]{3,}/.test(text) ? 'ru' : 'uz'
}

function extractPhone(text: string): string | null {
    const m = text.match(/\+?998\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/)
    if (!m) return null
    const c = m[0].replace(/\s/g, '')
    return c.startsWith('+') ? c : '+' + c
}

// ===== BOOKING STATE (in-memory, per chat) =====
const bookingState: Record<string, {
    step: 'select_service' | 'select_date' | 'select_time' | 'enter_name' | 'enter_phone'
    serviceId?: string
    serviceName?: string
    date?: string
    time?: string
    name?: string
}> = {}

// ===== DATE/TIME HELPERS =====
const DAY_NAMES_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAY_NAMES_UZ = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya']
const MONTH_NAMES_RU = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTH_NAMES_UZ = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

function getAvailableDates(daysAhead = 30): string[] {
    const dates: string[] = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 0; i < daysAhead; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
    }
    return dates
}

function formatDate(dateStr: string, lang: 'uz' | 'ru'): string {
    const d = new Date(dateStr + 'T00:00:00')
    const day = d.getDate()
    const month = d.getMonth() + 1
    const dow = d.getDay()
    const dayName = lang === 'ru' ? DAY_NAMES_RU[(dow + 6) % 7] : DAY_NAMES_UZ[(dow + 6) % 7]
    return `${dayName} ${day}/${month < 10 ? '0' + month : month}`
}

function generateTimeSlots(start: string, end: string, durationMin: number): string[] {
    const slots: string[] = []
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    let current = sh * 60 + sm
    const endMin = eh * 60 + em
    while (current + durationMin <= endMin) {
        const h = Math.floor(current / 60)
        const m = current % 60
        slots.push(`${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`)
        current += durationMin
    }
    return slots
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

// ===== MAIN HANDLER =====
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    try {
        const { botId } = await params
        const update = await request.json()
        console.log('[WEBHOOK]', JSON.stringify(update).slice(0, 300))

        // Opportunistic trigger for the reminders check
        const cronUrl = new URL(`/api/cron/reminders?secret=${process.env.WEBHOOK_SECRET}`, request.url)
        fetch(cronUrl.toString()).catch(() => { })

        const supabase = getSupabase()
        if (!supabase) return NextResponse.json({ ok: true })

        // Load bot
        const { data: bot } = await supabase.from('bots').select('*').eq('id', botId).single()
        if (!bot?.is_active) return NextResponse.json({ ok: true })

        // Handle callback queries (button presses)
        if (update.callback_query) {
            return handleCallback(supabase, bot, update.callback_query)
        }

        // Handle text messages 
        const message = update.message
        if (!message?.text) return NextResponse.json({ ok: true })

        const chatId = message.chat.id
        const text = message.text
        const tgUser = message.from
        const lang = bot.language === 'auto' ? detectLang(text) : bot.language as 'uz' | 'ru'
        const stateKey = `${botId}_${chatId}`

        // Save/update lead
        const { data: leadData } = await supabase.from('leads').upsert({
            bot_id: botId,
            telegram_id: chatId,
            telegram_username: tgUser?.username || null,
            first_name: tgUser?.first_name || null,
            last_name: tgUser?.last_name || null,
            language: lang,
            last_message: text.slice(0, 255),
        }, { onConflict: 'bot_id,telegram_id' }).select('id').single()

        const leadId = leadData?.id

        if (leadId && text !== '/start') {
            await supabase.from('chat_messages').insert({
                lead_id: leadId,
                bot_id: botId,
                role: 'user',
                content: text
            })
        }

        // ===== Check booking state =====
        if (bookingState[stateKey]) {
            return handleBookingInput(supabase, bot, chatId, text, lang, stateKey)
        }

        // ===== /start — Main menu with buttons =====
        if (text === '/start') {
            return sendMainMenu(supabase, bot, chatId, lang)
        }

        // ===== AI response =====
        const geminiKey = process.env.GEMINI_API_KEY || ''
        console.log('[AI DEBUG] GEMINI_API_KEY exists:', !!geminiKey, '| first 8 chars:', geminiKey.slice(0, 8))

        if (geminiKey) {
            try {
                let history: { role: 'user' | 'assistant' | 'system'; content: string }[] = []
                if (leadId) {
                    const { data: msgs } = await supabase.from('chat_messages')
                        .select('role, content')
                        .eq('lead_id', leadId)
                        .order('created_at', { ascending: false })
                        .limit(8)
                    if (msgs) history = msgs.reverse()
                }

                console.log('[AI DEBUG] Calling generateAIResponse, history length:', history.length)
                const { generateAIResponse } = await import('@/lib/ai/chat-engine')
                const { response, paymentInfo } = await generateAIResponse(
                    { id: botId, ai_prompt_context: bot.ai_prompt_context, language: bot.language },
                    history, text, lang, chatId
                )
                console.log('[AI DEBUG] Response length:', response?.length)

                let extraArgs: any = {}
                if (paymentInfo) {
                    const priceFormatted = formatPrice(paymentInfo.amount)
                    extraArgs = {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: `💳 ${lang === 'uz' ? 'To\'lov' : 'Оплатить'} (${priceFormatted}) via ${paymentInfo.provider.toUpperCase()}`,
                                callback_data: `pay_${paymentInfo.provider}_${paymentInfo.amount}`
                            }]]
                        }
                    }
                }

                await sendMessage(bot.bot_token, chatId, response, extraArgs)

                if (leadId && response) {
                    await supabase.from('chat_messages').insert({
                        lead_id: leadId,
                        bot_id: botId,
                        role: 'assistant',
                        content: response
                    })
                }
            } catch (e) {
                console.error('[AI ERROR]', e)
                await sendFallback(bot, chatId, lang)
            }
        } else {
            await sendFallback(bot, chatId, lang)
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[WEBHOOK] ERROR:', error)
        return NextResponse.json({ ok: true })
    }
}

// ===== MAIN MENU =====
async function sendMainMenu(supabase: any, bot: any, chatId: number, lang: 'uz' | 'ru') {
    // Load custom menu buttons
    const { data: buttons } = await supabase
        .from('bot_menu_buttons')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('is_active', true)
        .order('sort_order')

    let keyboard: { text: string; callback_data: string }[][] = []

    if (buttons?.length) {
        // Custom buttons from dashboard
        keyboard = buttons.map((btn: any) => [{
            text: `${btn.emoji} ${btn.label}`,
            callback_data: `menu_${btn.id}`,
        }])
    }
    // Если кнопок нет — отправляем просто приветствие без кнопок

    const welcomeMsg = bot.welcome_message || (lang === 'ru'
        ? '👋 Здравствуйте! Чем могу помочь?'
        : '👋 Assalomu alaykum! Qanday yordam bera olaman?')

    if (keyboard.length > 0) {
        await sendMessage(bot.bot_token, chatId, welcomeMsg, {
            reply_markup: { inline_keyboard: keyboard },
        })
    } else {
        await sendMessage(bot.bot_token, chatId, welcomeMsg)
    }
    return NextResponse.json({ ok: true })
}

// ===== HANDLE BUTTON PRESS =====
async function handleCallback(supabase: any, bot: any, callback: any) {
    const chatId = callback.message.chat.id
    const messageId = callback.message.message_id
    const data = callback.data
    const lang = bot.language === 'auto' ? 'uz' : bot.language as 'uz' | 'ru'
    const stateKey = `${bot.id}_${chatId}`

    await answerCallback(bot.bot_token, callback.id)

    // ===== Custom menu button =====
    if (data.startsWith('menu_')) {
        const btnId = data.replace('menu_', '')
        const { data: btn } = await supabase.from('bot_menu_buttons').select('*').eq('id', btnId).single()
        if (btn) {
            if (btn.action === 'services') return handleServicesAction(supabase, bot, chatId, messageId, lang)
            if (btn.action === 'booking') return handleBookingAction(supabase, bot, chatId, messageId, lang)
            if (btn.action === 'contact') {
                const msg = lang === 'ru'
                    ? '📞 Отправьте ваш номер телефона (+998...) и мы свяжемся с вами!'
                    : '📞 Telefon raqamingizni (+998...) yuboring, biz siz bilan bog\'lanamiz!'
                await sendMessage(bot.bot_token, chatId, msg)
                return NextResponse.json({ ok: true })
            }
            if (btn.action === 'link' && btn.action_value) {
                await sendMessage(bot.bot_token, chatId, btn.action_value)
                return NextResponse.json({ ok: true })
            }
            // Default: send text
            await sendMessage(bot.bot_token, chatId, btn.action_value || btn.label)
            return NextResponse.json({ ok: true })
        }
    }

    // ===== Default action buttons =====
    if (data === 'action_services' || data === 'action_prices') {
        return handleServicesAction(supabase, bot, chatId, messageId, lang)
    }

    if (data === 'action_booking') {
        return handleBookingAction(supabase, bot, chatId, messageId, lang)
    }

    if (data === 'action_contact') {
        const msg = lang === 'ru'
            ? '📞 Отправьте ваш номер телефона в формате <b>+998 XX XXX-XX-XX</b> и мы свяжемся!'
            : '📞 Telefon raqamingizni <b>+998 XX XXX-XX-XX</b> formatida yuboring!'
        await sendMessage(bot.bot_token, chatId, msg)
        return NextResponse.json({ ok: true })
    }

    if (data === 'action_question') {
        const msg = lang === 'ru'
            ? '❓ Напишите ваш вопрос, и мы ответим на него!'
            : '❓ Savolingizni yozing, biz javob beramiz!'
        await sendMessage(bot.bot_token, chatId, msg)
        return NextResponse.json({ ok: true })
    }

    if (data === 'action_menu') {
        return sendMainMenu(supabase, bot, chatId, lang)
    }

    // ===== Select service for booking =====
    if (data.startsWith('book_svc_')) {
        const serviceId = data.replace('book_svc_', '')
        const { data: svc } = await supabase.from('bot_services').select('*').eq('id', serviceId).single()
        if (!svc) return NextResponse.json({ ok: true })

        bookingState[stateKey] = { step: 'select_date', serviceId, serviceName: svc.name }

        // Show calendar
        return showCalendar(supabase, bot, chatId, lang, svc.name)
    }

    // ===== Select date =====
    if (data.startsWith('book_date_')) {
        const date = data.replace('book_date_', '')
        const state = bookingState[stateKey]
        if (!state) return sendMainMenu(supabase, bot, chatId, lang)

        state.date = date
        state.step = 'select_time'

        // Show time slots
        return showTimeSlots(supabase, bot, chatId, date, lang, state.serviceName || '')
    }

    // ===== Select time =====
    if (data.startsWith('book_time_')) {
        const time = data.replace('book_time_', '')
        const state = bookingState[stateKey]
        if (!state) return sendMainMenu(supabase, bot, chatId, lang)

        state.time = time
        state.step = 'enter_name'

        const msg = lang === 'ru'
            ? `✅ Вы выбрали:\n📋 ${state.serviceName}\n📅 ${state.date}\n🕐 ${time}\n\n👤 <b>Введите ваше имя:</b>`
            : `✅ Siz tanladingiz:\n📋 ${state.serviceName}\n📅 ${state.date}\n🕐 ${time}\n\n👤 <b>Ismingizni kiriting:</b>`
        await sendMessage(bot.bot_token, chatId, msg)
        return NextResponse.json({ ok: true })
    }

    // Calendar navigation
    if (data.startsWith('cal_page_')) {
        const page = parseInt(data.replace('cal_page_', ''))
        const state = bookingState[stateKey]
        return showCalendar(supabase, bot, chatId, lang, state?.serviceName || '', page)
    }

    if (data === 'noop') {
        return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
}

// ===== SERVICES LIST =====
async function handleServicesAction(supabase: any, bot: any, chatId: number, messageId: number, lang: 'uz' | 'ru') {
    const { data: services } = await supabase
        .from('bot_services')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('is_active', true)
        .order('sort_order')

    if (!services?.length) {
        const msg = lang === 'ru' ? '📋 Список услуг пока не добавлен.' : '📋 Xizmatlar ro\'yxati hali qo\'shilmagan.'
        await sendMessage(bot.bot_token, chatId, msg, {
            reply_markup: { inline_keyboard: [[{ text: lang === 'ru' ? '◀️ Назад' : '◀️ Orqaga', callback_data: 'action_menu' }]] },
        })
        return NextResponse.json({ ok: true })
    }

    let text = lang === 'ru' ? '🛍 <b>Наши услуги:</b>\n\n' : '🛍 <b>Xizmatlarimiz:</b>\n\n'
    services.forEach((svc: any, i: number) => {
        text += `${i + 1}. <b>${svc.name}</b>\n`
        if (svc.description) text += `   ${svc.description}\n`
        text += `   💰 ${formatPrice(svc.price)}`
        if (svc.duration_minutes) text += ` | ⏱ ${svc.duration_minutes} ${lang === 'ru' ? 'мин' : 'daq'}`
        text += '\n\n'
    })

    const keyboard = [
        ...services.map((svc: any) => [{
            text: `📅 ${svc.name} — ${formatPrice(svc.price)}`,
            callback_data: `book_svc_${svc.id}`,
        }]),
        [{ text: lang === 'ru' ? '◀️ Меню' : '◀️ Menyu', callback_data: 'action_menu' }],
    ]

    await sendMessage(bot.bot_token, chatId, text, {
        reply_markup: { inline_keyboard: keyboard },
    })
    return NextResponse.json({ ok: true })
}

// ===== BOOKING START =====
async function handleBookingAction(supabase: any, bot: any, chatId: number, messageId: number, lang: 'uz' | 'ru') {
    const { data: services } = await supabase
        .from('bot_services')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('is_active', true)
        .order('sort_order')

    if (!services?.length) {
        const msg = lang === 'ru'
            ? '📅 Для записи необходимо, чтобы владелец добавил услуги.'
            : '📅 Yozilish uchun xizmatlar qo\'shilishi kerak.'
        await sendMessage(bot.bot_token, chatId, msg, {
            reply_markup: { inline_keyboard: [[{ text: lang === 'ru' ? '◀️ Назад' : '◀️ Orqaga', callback_data: 'action_menu' }]] },
        })
        return NextResponse.json({ ok: true })
    }

    const text = lang === 'ru'
        ? '📅 <b>Запись на услугу</b>\n\nВыберите услугу:'
        : '📅 <b>Xizmatga yozilish</b>\n\nXizmatni tanlang:'

    const keyboard = [
        ...services.map((svc: any) => [{
            text: `${svc.name} — ${formatPrice(svc.price)}`,
            callback_data: `book_svc_${svc.id}`,
        }]),
        [{ text: lang === 'ru' ? '◀️ Меню' : '◀️ Menyu', callback_data: 'action_menu' }],
    ]

    await sendMessage(bot.bot_token, chatId, text, {
        reply_markup: { inline_keyboard: keyboard },
    })
    return NextResponse.json({ ok: true })
}

// ===== CALENDAR =====
async function showCalendar(supabase: any, bot: any, chatId: number, lang: 'uz' | 'ru', serviceName: string, page = 0) {
    const dates = getAvailableDates(30)

    // Get schedule
    const { data: schedule } = await supabase
        .from('bot_schedule')
        .select('*')
        .eq('bot_id', bot.id)

    // Get blocked dates
    const { data: blocked } = await supabase
        .from('bot_blocked_dates')
        .select('blocked_date')
        .eq('bot_id', bot.id)
    const blockedSet = new Set((blocked || []).map((b: any) => b.blocked_date))

    // Filter dates: only working days
    const workingDays = (schedule || [])
        .filter((s: any) => s.is_working)
        .map((s: any) => s.day_of_week)

    const filteredDates = dates.filter(dateStr => {
        if (blockedSet.has(dateStr)) return false
        if (workingDays.length === 0) return true // If no schedule set, allow all
        const d = new Date(dateStr + 'T00:00:00')
        const dow = (d.getDay() + 6) % 7 // Convert to Mon=0
        return workingDays.includes(dow)
    })

    // Paginate: 8 dates per page
    const perPage = 8
    const start = page * perPage
    const pagesDates = filteredDates.slice(start, start + perPage)
    const hasMore = filteredDates.length > start + perPage

    if (!pagesDates.length) {
        const msg = lang === 'ru' ? '😔 Нет доступных дат.' : '😔 Bo\'sh sanalar yo\'q.'
        await sendMessage(bot.bot_token, chatId, msg, {
            reply_markup: { inline_keyboard: [[{ text: lang === 'ru' ? '◀️ Назад' : '◀️ Orqaga', callback_data: 'action_booking' }]] },
        })
        return NextResponse.json({ ok: true })
    }

    const text = lang === 'ru'
        ? `📅 <b>Выберите дату</b>\n📋 Услуга: ${serviceName}`
        : `📅 <b>Sanani tanlang</b>\n📋 Xizmat: ${serviceName}`

    const keyboard: { text: string; callback_data: string }[][] = []
    // 2 buttons per row
    for (let i = 0; i < pagesDates.length; i += 2) {
        const row = [{ text: formatDate(pagesDates[i], lang), callback_data: `book_date_${pagesDates[i]}` }]
        if (pagesDates[i + 1]) {
            row.push({ text: formatDate(pagesDates[i + 1], lang), callback_data: `book_date_${pagesDates[i + 1]}` })
        }
        keyboard.push(row)
    }

    // Navigation
    const navRow: { text: string; callback_data: string }[] = []
    if (page > 0) navRow.push({ text: '⬅️', callback_data: `cal_page_${page - 1}` })
    if (hasMore) navRow.push({ text: '➡️', callback_data: `cal_page_${page + 1}` })
    if (navRow.length) keyboard.push(navRow)
    keyboard.push([{ text: lang === 'ru' ? '◀️ Назад' : '◀️ Orqaga', callback_data: 'action_booking' }])

    await sendMessage(bot.bot_token, chatId, text, {
        reply_markup: { inline_keyboard: keyboard },
    })
    return NextResponse.json({ ok: true })
}

// ===== TIME SLOTS =====
async function showTimeSlots(supabase: any, bot: any, chatId: number, dateStr: string, lang: 'uz' | 'ru', serviceName: string) {
    const d = new Date(dateStr + 'T00:00:00')
    const dow = (d.getDay() + 6) % 7

    // Get schedule for this day
    const { data: scheduleRow } = await supabase
        .from('bot_schedule')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('day_of_week', dow)
        .single()

    const startTime = scheduleRow?.start_time || '10:00'
    const endTime = scheduleRow?.end_time || '18:00'
    const slotDuration = scheduleRow?.slot_duration_minutes || 60

    const allSlots = generateTimeSlots(startTime, endTime, slotDuration)

    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('bot_id', bot.id)
        .eq('booking_date', dateStr)
        .in('status', ['pending', 'confirmed'])

    const bookedTimes = new Set((existingBookings || []).map((b: any) => b.booking_time?.slice(0, 5)))

    // Filter: remove past times if today
    const now = new Date()
    const isToday = dateStr === now.toISOString().split('T')[0]
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const availableSlots = allSlots.filter(slot => {
        if (bookedTimes.has(slot)) return false
        if (isToday) {
            const [h, m] = slot.split(':').map(Number)
            if (h * 60 + m <= currentMinutes) return false
        }
        return true
    })

    if (!availableSlots.length) {
        const msg = lang === 'ru'
            ? `😔 На ${dateStr} нет свободного времени. Выберите другую дату.`
            : `😔 ${dateStr} da bo'sh vaqt yo'q. Boshqa sanani tanlang.`
        await sendMessage(bot.bot_token, chatId, msg, {
            reply_markup: { inline_keyboard: [[{ text: lang === 'ru' ? '◀️ Назад к датам' : '◀️ Sanalarga qaytish', callback_data: 'action_booking' }]] },
        })
        return NextResponse.json({ ok: true })
    }

    const text = lang === 'ru'
        ? `🕐 <b>Выберите время</b>\n📅 Дата: ${formatDate(dateStr, lang)}\n📋 ${serviceName}\n\n✅ Свободно | ❌ Занято`
        : `🕐 <b>Vaqtni tanlang</b>\n📅 Sana: ${formatDate(dateStr, lang)}\n📋 ${serviceName}\n\n✅ Bo'sh | ❌ Band`

    const keyboard: { text: string; callback_data: string }[][] = []
    for (let i = 0; i < availableSlots.length; i += 3) {
        const row: { text: string; callback_data: string }[] = []
        for (let j = 0; j < 3 && i + j < availableSlots.length; j++) {
            row.push({ text: `✅ ${availableSlots[i + j]}`, callback_data: `book_time_${availableSlots[i + j]}` })
        }
        keyboard.push(row)
    }
    keyboard.push([{ text: lang === 'ru' ? '◀️ Назад к датам' : '◀️ Sanalarga qaytish', callback_data: 'action_booking' }])

    await sendMessage(bot.bot_token, chatId, text, {
        reply_markup: { inline_keyboard: keyboard },
    })
    return NextResponse.json({ ok: true })
}

// ===== HANDLE BOOKING TEXT INPUT (name, phone) =====
async function handleBookingInput(supabase: any, bot: any, chatId: number, text: string, lang: 'uz' | 'ru', stateKey: string) {
    const state = bookingState[stateKey]

    if (state.step === 'enter_name') {
        state.name = text.trim()
        state.step = 'enter_phone'
        const msg = lang === 'ru'
            ? `👤 Имя: <b>${state.name}</b>\n\n📞 <b>Введите номер телефона (+998...):</b>`
            : `👤 Ism: <b>${state.name}</b>\n\n📞 <b>Telefon raqamingizni kiriting (+998...):</b>`
        await sendMessage(bot.bot_token, chatId, msg)
        return NextResponse.json({ ok: true })
    }

    if (state.step === 'enter_phone') {
        const phone = extractPhone(text) || text.trim()

        // Save booking!
        const { error } = await supabase.from('bookings').insert({
            bot_id: bot.id,
            service_id: state.serviceId || null,
            telegram_id: chatId,
            customer_name: state.name || '',
            customer_phone: phone,
            service_name: state.serviceName || '',
            booking_date: state.date,
            booking_time: state.time,
            status: 'confirmed', // Bot o'zi avtomatik tasdiqlaydi / Автоматическое подтверждение
        })

        // Update lead
        await supabase.from('leads').upsert({
            bot_id: bot.id,
            telegram_id: chatId,
            customer_phone: extractPhone(text) || null,
            status: 'contacted',
            chat_summary: `📅 ${state.serviceName} | ${state.date} ${state.time}`,
            last_message: `Запись: ${state.serviceName}`,
        }, { onConflict: 'bot_id,telegram_id' })

        delete bookingState[stateKey]

        if (error) {
            console.error('[BOOKING ERROR]', error)
            const msg = lang === 'ru' ? '❌ Ошибка при записи. Попробуйте позже.' : '❌ Yozilishda xatolik. Keyinroq urinib ko\'ring.'
            await sendMessage(bot.bot_token, chatId, msg)
            return NextResponse.json({ ok: true })
        }

        const msg = lang === 'ru'
            ? `✅ <b>Вы успешно записаны!</b>\n\n📋 Услуга: <b>${state.serviceName}</b>\n📅 Дата: <b>${state.date}</b>\n🕐 Время: <b>${state.time}</b>\n👤 Имя: ${state.name}\n📞 Телефон: ${phone}\n\nС нетерпением ждем вас! 🤝`
            : `✅ <b>Siz muvaffaqiyatli yozildingiz!</b>\n\n📋 Xizmat: <b>${state.serviceName}</b>\n📅 Sana: <b>${state.date}</b>\n🕐 Vaqt: <b>${state.time}</b>\n👤 Ism: ${state.name}\n📞 Telefon: ${phone}\n\nSizni kutib qolamiz! 🤝`

        await sendMessage(bot.bot_token, chatId, msg, {
            reply_markup: {
                inline_keyboard: [[{ text: lang === 'ru' ? '🏠 Главное меню' : '🏠 Bosh menyu', callback_data: 'action_menu' }]],
            },
        })
        return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
}

// ===== FALLBACK =====
async function sendFallback(bot: any, chatId: number, lang: 'uz' | 'ru') {
    const msg = lang === 'ru'
        ? '🤖 Спасибо за сообщение! Наш менеджер свяжется с вами.'
        : '🤖 Xabaringiz uchun rahmat! Menejerimiz siz bilan bog\'lanadi.'
    await sendMessage(bot.bot_token, chatId, msg)
}

