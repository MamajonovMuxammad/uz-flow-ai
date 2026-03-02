/**
 * Language Guard — automatically detects Uzbek or Russian
 * and returns responses in the same language.
 */

const UZBEK_PATTERNS = [
    /\b(salom|assalomu|alaykum|rahmat|xayr|yaxshi|nima|qanday|qayerda|kimdir|men|sen|siz|bu|u|ular|biz|va|yoki|ham|emas|bor|yo'q|kerak|iltimos|albatta|ha|yo'q|narx|mahsulot|xizmat|sotib|olmoq|qilmoq|bo'lmoq)\b/i,
    /[a-zA-Z]*[oʻgʻ][a-zA-Z]*/,
    /\b(uy|shahar|ko'cha|telefon|raqam|pul|summa|toVar)\b/i,
]

const RUSSIAN_PATTERNS = [
    /[а-яёА-ЯЁ]{2,}/,
    /\b(привет|здравствуйте|спасибо|пожалуйста|да|нет|хорошо|что|как|где|когда|кто|это|я|вы|мы|они|и|или|не|есть|нужно|цена|товар|услуга|купить|сделать)\b/i,
]

export type Language = 'uz' | 'ru' | 'unknown'

export function detectLanguage(text: string): Language {
    const russianScore = RUSSIAN_PATTERNS.filter(p => p.test(text)).length
    const uzbekScore = UZBEK_PATTERNS.filter(p => p.test(text)).length

    if (russianScore > uzbekScore) return 'ru'
    if (uzbekScore >= 0) return 'uz' // default to Uzbek for Uzbekistan market
    return 'uz'
}

export function getSystemPrompt(language: Language, businessContext: string): string {
    const base = businessContext || 'professional sales assistant for a business in Uzbekistan'

    const prompts = {
        uz: `Siz O'zbekistonda kompaniya uchun ELITA darajasidagi, samimiy va professional AI Savdo Menejerisiz (Sales Manager).

Qat'iy qoidalar:
1. KISQA JAVOB BERISH: Javoblaringizni 3-5 qator oralig'ida qisqa va aniq tuting. Juda katta matn yozmang.
2. SOTUV LIGIKASI: Mijozning nima qidirayotganini tushuning -> Mahsulotni taqdim eting -> E'tirozlarni yengib o'ting -> Sotuvni yakunlang. O'zgaruvchan e'tirozlarda (masalan, "qimmat", "o'ylab ko'raman") - qiymatni yoriting, bahslashmang.
3. KONTEKST VA RAG: Faqatgina bazadan olingan (quyida berilgan) ma'lumotlardan foydalaning. Agar savolga javob bazada bo'lmasa, uni o'ylab topmang, buni barcha xushmuomalalik bilan tushuntirib, inson-menejerni ulashni taklif qiling.
4. TAQIQLAR: Siyosat, din, kodlash yoki biznesdan tashqari boshqa mavzularni muhokama qilmang.
5. SOTUV VA TO'LOV: Mijoz sotib olishga tayyor bo'lsa, telefon raqamini (+998...) o'zbekcha yozib qoldirishini yoki to'lov turini so'rang (Click/Payme).

Biznes konteksti: ${base}

Suhbat oxirida asosan to'g'ri va qisqa savol bering.`,

        ru: `Вы элитный, дружелюбный и профессиональный AI-менеджер по продажам для компании в Узбекистане.

Строгие правила:
1. КРАТКОСТЬ: Держите ответы в рамках 3-5 коротких строк. Избегайте "полотен" текста. Разделяйте абзацы.
2. ЛОГИКА ПРОДАЖ: Поймите потребность -> Предложите товар -> Обработайте возражения -> Закройте на покупку. Если говорят "Дорого" - подчеркните ценность. Если "Подумаю" - уточните сомнения.
3. КОНТЕКСТ И БАЗА ЗНАНИЙ: Используйте ТОЛЬКО информацию из базы (передана ниже). Если ответа нет - вежливо скажите об этом и предложите связать с живым менеджером. Не придумывайте цены или ссылки.
4. ОГРАНИЧЕНИЯ: Категорически запрещено обсуждать политику, религию, программирование и любые темы вне бизнеса.
5. ЗАКРЫТИЕ СДЕЛКИ: Когда клиент готов, обязательно попросите номер телефона (в формате +998) или предложите вариант оплаты (Click/Payme).

Контекст бизнеса: ${base}

Завершайте сообщение уместным вопросом, чтобы вести диалог.`,

        unknown: `You are an elite, highly polite AI Sales Manager for a business in Uzbekistan. 

RULES:
1. BREVITY: Max 3-5 lines per message.
2. NO HALLUCINATION: Rely only on the given knowledge base.
3. OUT OF BOUNDS: Never discuss politics, religion, or off-topic subjects.
4. CONVERSION: Handle customer objections gently, ask for their +998 phone number when they are ready to buy.

Business context: ${base}`
    }

    return prompts[language]
}

export function getWelcomeMessage(language: Language): string {
    const messages = {
        uz: "Assalomu alaykum! Men sizning AI yordamchingizman. Qanday yordam bera olaman? 🤝",
        ru: "Здравствуйте! Я ваш AI-ассистент. Чем могу помочь? 🤝",
        unknown: "Assalomu alaykum! / Здравствуйте! 🤝"
    }
    return messages[language]
}

export function getPhoneRequestMessage(language: Language): string {
    const messages = {
        uz: "Siz bilan bog'lanishimiz uchun telefon raqamingizni qoldirishingiz mumkinmi? (+998 XX XXX-XX-XX formatida)",
        ru: "Можете ли вы оставить свой номер телефона, чтобы мы могли с вами связаться? (в формате +998 XX XXX-XX-XX)",
        unknown: "Telefon raqamingizni qoldiring / Оставьте ваш номер телефона"
    }
    return messages[language]
}

export function extractPhoneNumber(text: string): string | null {
    // Match Uzbek phone numbers in various formats
    const patterns = [
        /\+998\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/,
        /998\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/,
        /0\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/,
        /\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/, // local format
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            let phone = match[0].replace(/\s/g, '')
            if (!phone.startsWith('+')) {
                if (phone.startsWith('998')) phone = '+' + phone
                else if (phone.startsWith('0')) phone = '+998' + phone.slice(1)
                else phone = '+998' + phone
            }
            return phone
        }
    }
    return null
}
