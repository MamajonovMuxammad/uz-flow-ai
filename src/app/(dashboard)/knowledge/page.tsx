'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BookOpen, Plus, Trash2, Loader2, FileText,
    AlertCircle, CheckCircle, Upload, Bot
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, truncate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

const CONTENT_TYPE_LABELS: Record<string, { uz: string, ru: string }> = {
    text: { uz: 'Matn', ru: 'Текст' },
    faq: { uz: 'FAQ', ru: 'FAQ (Часто задаваемые вопросы)' },
    product: { uz: 'Mahsulot', ru: 'Продукт/Услуга' },
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
    text: 'text-blue-400 bg-blue-400/10',
    faq: 'text-green-400 bg-green-400/10',
    product: 'text-purple-400 bg-purple-400/10',
}

export default function KnowledgePage() {
    const supabase = createClient()
    const { lang } = useLanguage()
    const [bots, setBots] = useState<any[]>([])
    const [selectedBot, setSelectedBot] = useState<string>('')
    const [docs, setDocs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        title: '',
        content_text: '',
        content_type: 'text',
    })

    useEffect(() => {
        loadBots()
    }, [])

    useEffect(() => {
        if (selectedBot) loadDocs()
    }, [selectedBot])

    const loadBots = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('bots').select('id, name').eq('owner_id', user.id)
        setBots(data || [])
        if (data?.length) setSelectedBot(data[0].id)
    }

    const loadDocs = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('bot_id', selectedBot)
            .order('created_at', { ascending: false })
        setDocs(data || [])
        setLoading(false)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBot) { toast.error(lang === 'uz' ? 'Avval bot tanlang' : 'Сначала выберите бота'); return }
        if (!form.content_text.trim()) { toast.error(lang === 'uz' ? 'Matn bo\'sh bo\'lmasin' : 'Текст не должен быть пустым'); return }

        setSubmitting(true)
        try {
            // Store without embedding first (embed via API route)
            const { error } = await supabase.from('knowledge_base').insert({
                bot_id: selectedBot,
                title: form.title || (lang === 'uz' ? 'Hujjat' : 'Документ'),
                content_text: form.content_text,
                content_type: form.content_type as 'text' | 'faq' | 'product',
            })

            if (error) throw error

            // Trigger embedding generation
            const res = await fetch('/api/knowledge/embed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId: selectedBot }),
            })

            toast.success((lang === 'uz' ? 'Bilim bazasiga qo\'shildi!' : 'Добавлено в базу знаний!') + (res.ok ? (lang === 'uz' ? ' Embedding tayyor.' : ' Векторы готовы.') : (lang === 'uz' ? ' (Embedding keyinroq bo\'ladi)' : ' (Векторы будут созданы позже)')))
            setForm({ title: '', content_text: '', content_type: 'text' })
            loadDocs()
        } catch (err: any) {
            toast.error((lang === 'uz' ? 'Xatolik: ' : 'Ошибка: ') + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
        if (error) { toast.error(lang === 'uz' ? 'O\'chirib bo\'lmadi' : 'Не удалось удалить'); return }
        toast.success(lang === 'uz' ? 'O\'chirildi' : 'Удалено')
        setDocs(docs.filter(d => d.id !== id))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{lang === 'uz' ? 'Bilim Bazasi' : 'База знаний'}</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{lang === 'uz' ? 'Botingiz biladigan ma\'lumotlarni boshqaring (RAG)' : 'Управляйте тем, что знает ваш бот (RAG)'}</p>
                </div>
                {/* Bot selector */}
                {bots.length > 1 && (
                    <select
                        value={selectedBot}
                        onChange={e => setSelectedBot(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500/50 transition-all"
                    >
                        {bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                    </select>
                )}
            </div>

            {!bots.length ? (
                <div className="glass border border-white/5 rounded-2xl p-16 text-center">
                    <Bot className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500">{lang === 'uz' ? 'Avval bot yarating' : 'Сначала создайте бота'}</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Add Document Form */}
                    <div className="glass border border-white/5 rounded-xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-purple-400" />
                            {lang === 'uz' ? 'Yangi Ma\'lumot Qo\'shish' : 'Добавить новые знания'}
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            {/* Type Selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, content_type: value }))}
                                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${form.content_type === value
                                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                                            : 'border-white/5 bg-white/3 text-gray-400 hover:border-white/10'
                                            }`}
                                    >
                                        {lang === 'ru' ? label.ru : label.uz}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Sarlavha' : 'Заголовок'}</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder={lang === 'uz' ? 'Masalan: Narxlar ro\'yxati' : 'Например: Список цен'}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Matn / Ma\'lumot' : 'Текст / Информация'}</label>
                                <textarea
                                    required
                                    value={form.content_text}
                                    onChange={e => setForm(f => ({ ...f, content_text: e.target.value }))}
                                    rows={8}
                                    placeholder={
                                        form.content_type === 'product'
                                            ? (lang === 'uz' ? 'Mahsulot nomi: iPhone 15 Pro\nNarxi: 14 000 000 so\'m\nXususiyatlari: ...' : 'Название продукта: iPhone 15 Pro\nЦена: 14 000 000 сум\nХарактеристики: ...')
                                            : form.content_type === 'faq'
                                                ? (lang === 'uz' ? 'Savol: Yetkazib berish narxi qancha?\nJavob: 15 000 so\'m, 1-3 kun ichida.' : 'Вопрос: Какая стоимость доставки?\nОтвет: 15 000 сум, за 1-3 дня.')
                                                : (lang === 'uz' ? 'Kompaniyangiz haqida ma\'lumot, xizmatlar, ish vaqti...' : 'Информация о вашей компании, услугах, графике работы...')
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all resize-none"
                                />
                                <p className="text-xs text-gray-600">{form.content_text.length} {lang === 'uz' ? 'belgi' : 'символов'}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'uz' ? 'Qo\'shilmoqda...' : 'Добавление...'}</> : <><Upload className="w-4 h-4" /> {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}</>}
                            </button>
                        </form>
                    </div>

                    {/* Documents List */}
                    <div className="glass border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                {lang === 'uz' ? 'Saqlangan Ma\'lumotlar' : 'Сохраненные данные'} ({docs.length})
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center">
                                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                            </div>
                        ) : !docs.length ? (
                            <div className="p-10 text-center">
                                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{lang === 'uz' ? 'Hali ma\'lumot yo\'q' : 'Пока нет данных'}</p>
                                <p className="text-gray-600 text-xs mt-1">{lang === 'uz' ? 'Chap tarafdan qo\'shing' : 'Добавьте с левой стороны'}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                                {docs.map(doc => (
                                    <div key={doc.id} className="p-4 hover:bg-white/2 transition-colors group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${CONTENT_TYPE_COLORS[doc.content_type]}`}>
                                                        {lang === 'ru' ? CONTENT_TYPE_LABELS[doc.content_type].ru : CONTENT_TYPE_LABELS[doc.content_type].uz}
                                                    </span>
                                                    <span className="text-xs text-gray-600">{timeAgo(doc.created_at)}</span>
                                                    {doc.embedding_vector && (
                                                        <span className="text-xs text-green-500 flex items-center gap-0.5">
                                                            <CheckCircle className="w-3 h-3" />
                                                            AI
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-white text-sm truncate">{doc.title}</div>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                    {truncate(doc.content_text, 120)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/0 hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
