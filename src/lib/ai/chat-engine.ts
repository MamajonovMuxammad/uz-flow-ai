import { createClient } from '@supabase/supabase-js'
import { detectLanguage, getSystemPrompt, extractPhoneNumber, type Language } from './language-guard'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-1.5-flash-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
const EMBED_URL = `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface BotConfig {
    id: string
    ai_prompt_context: string
    language: 'uz' | 'ru' | 'auto'
}

/**
 * Call Gemini REST API directly
 */
async function callGemini(contents: any[]): Promise<string> {
    const body: any = {
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
        }
    }

    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Get relevant context from knowledge base using vector similarity
 */
async function getKnowledgeContext(botId: string, query: string): Promise<string> {
    try {
        const res = await fetch(EMBED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text: query }] } })
        })

        if (!res.ok) return ''

        const data = await res.json()
        const queryEmbedding = data.embedding?.values
        if (!queryEmbedding) return ''

        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7,
            match_count: 3,
            p_bot_id: botId,
        })

        if (error || !documents?.length) return ''

        const context = documents.map((doc: { content_text: string }) => doc.content_text).join('\n\n---\n\n')
        return `\n\nRelevant business knowledge:\n${context}`
    } catch {
        return ''
    }
}

/**
 * Main AI chat function with RAG and language detection
 */
export async function generateAIResponse(
    botConfig: BotConfig,
    conversationHistory: ChatMessage[],
    userMessage: string,
    detectedLanguage?: Language,
    chatId?: number
): Promise<{ response: string; language: Language; phoneFound: string | null; dbUpdated?: boolean; paymentInfo?: any }> {
    const lang = botConfig.language === 'auto'
        ? (detectedLanguage || detectLanguage(userMessage))
        : botConfig.language as Language

    const phoneFound = extractPhoneNumber(userMessage)

    // Get knowledge base context for RAG
    const knowledgeContext = await getKnowledgeContext(botConfig.id, userMessage)

    // Build system prompt
    const systemPrompt = getSystemPrompt(lang, botConfig.ai_prompt_context) + knowledgeContext

    // Format history for Gemini (alternating user/model turns)
    const geminiHistory = conversationHistory.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }))

    // Make sure history alternates properly (Gemini requirement)
    const filteredHistory: any[] = []
    let lastRole = ''
    for (const msg of geminiHistory) {
        if (msg.role !== lastRole) {
            filteredHistory.push(msg)
            lastRole = msg.role
        }
    }

    // Add system prompt + current user message as first user message
    // For v1 API, system prompt goes inside the contents
    const fullUserMessage = `${systemPrompt}\n\n---\n\nUser message: ${userMessage}`

    // Add current user message (with system prompt prepended if no history)
    const contents = [
        ...filteredHistory,
        { role: 'user', parts: [{ text: filteredHistory.length === 0 ? fullUserMessage : userMessage }] }
    ]

    // If there's history, add system as a preamble to the FIRST message
    if (filteredHistory.length > 0 && contents.length > 0) {
        const firstUserIdx = contents.findIndex(c => c.role === 'user')
        if (firstUserIdx >= 0) {
            contents[firstUserIdx].parts[0].text = systemPrompt + '\n\n---\n\n' + contents[firstUserIdx].parts[0].text
        }
    }

    console.log('[AI] Calling Gemini', GEMINI_MODEL, '| key prefix:', GEMINI_API_KEY.slice(0, 8), '| history:', filteredHistory.length)

    const responseText = await callGemini(contents)

    console.log('[AI] Got response, length:', responseText.length)

    return {
        response: responseText || (lang === 'ru' ? 'Извините, произошла ошибка.' : 'Kechirasiz, xatolik yuz berdi.'),
        language: lang,
        phoneFound,
        dbUpdated: false,
        paymentInfo: null
    }
}

/**
 * Embed text for knowledge base storage
 */
export async function embedText(text: string): Promise<number[]> {
    try {
        const res = await fetch(EMBED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text }] } })
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.embedding?.values || []
    } catch {
        return []
    }
}
