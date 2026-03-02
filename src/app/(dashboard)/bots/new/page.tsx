'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    Bot, ArrowLeft, Key, MessageSquare, Languages,
    Loader2, AlertCircle, CheckCircle, Globe, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const languages = [
    { value: 'auto', label: 'Avtomatik (UZ/RU)', desc: 'Foydalanuvchi tiliga qarab', icon: Globe },
    { value: 'uz', label: 'Faqat O\'zbekcha', desc: 'Har doim o\'zbek tilida', icon: Languages },
    { value: 'ru', label: 'Faqat Ruscha', desc: 'Har doim rus tilida', icon: Languages },
]

export default function NewBotPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '',
        bot_token: '',
        language: 'auto',
        welcome_message: 'Assalomu alaykum! Men sizning AI yordamchingizman. Qanday yordam bera olaman? 🤝',
        ai_prompt_context: 'Siz O\'zbekistonda joylashgan kompaniyaning professional savdo yordamchisisiz. Mahsulot/xizmatlarimiz haqida to\'liq ma\'lumot bering. Har doim "Siz" deb murojaat qiling. Mijoz telefon raqamini (+998 formatida) olishga harakat qiling.',
        openai_api_key: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.bot_token.match(/^\d+:[A-Za-z0-9_-]{35,}$/)) {
            setError('Bot token noto\'g\'ri formatda. @BotFather dan oling.')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase.from('bots').insert({
                owner_id: user.id,
                name: form.name,
                bot_token: form.bot_token,
                language: form.language as 'uz' | 'ru' | 'auto',
                welcome_message: form.welcome_message,
                ai_prompt_context: form.ai_prompt_context,
                openai_api_key: form.openai_api_key || null,
                is_active: false,
            }).select().single()

            if (error) throw error

            toast.success('Bot muvaffaqiyatli yaratildi!')
            router.push(`/bots/${data.id}/settings`)
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/bots" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Yangi Bot Yaratish</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Telegram botingizni ulang va AI bilan ishlating</p>
                </div>
            </div>

            {/* Instructions */}
            <div className="glass border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm mb-2">
                    <Zap className="w-4 h-4" />
                    Bot token olish uchun:
                </div>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Telegramda <strong className="text-white">@BotFather</strong> ni oching</li>
                    <li><code className="bg-white/5 px-1 rounded text-xs">/newbot</code> buyrug'ini yuboring</li>
                    <li>Bot uchun nom va username kiriting</li>
                    <li>Token nusxalab oling va quyida kiritiring</li>
                </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Bot Name */}
                <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        Asosiy Ma'lumotlar
                    </h3>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">Bot nomi</label>
                        <input
                            id="bot-name"
                            type="text"
                            required
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Mening Do'konim Boti"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">Telegram Bot Token</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                id="bot-token"
                                type="text"
                                required
                                value={form.bot_token}
                                onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
                                placeholder="1234567890:ABCDEFghijklmnopqrstuvwxyz1234567"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Language */}
                <div className="glass border border-white/5 rounded-xl p-5 space-y-3">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Til Sozlamasi
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {languages.map(lang => (
                            <button
                                key={lang.value}
                                type="button"
                                onClick={() => setForm(f => ({ ...f, language: lang.value }))}
                                className={cn(
                                    'p-3 rounded-xl border text-left transition-all',
                                    form.language === lang.value
                                        ? 'border-purple-500/50 bg-purple-500/10 text-white'
                                        : 'border-white/5 bg-white/3 text-gray-400 hover:border-white/10'
                                )}
                            >
                                <div className="text-xs font-medium mb-0.5">{lang.label}</div>
                                <div className="text-xs opacity-60">{lang.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-400" />
                        Xabar Shablonlari
                    </h3>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">Xush kelibsiz xabari</label>
                        <textarea
                            value={form.welcome_message}
                            onChange={e => setForm(f => ({ ...f, welcome_message: e.target.value }))}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">AI Kontekst (System Prompt)</label>
                        <textarea
                            value={form.ai_prompt_context}
                            onChange={e => setForm(f => ({ ...f, ai_prompt_context: e.target.value }))}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-600">AI bu ko'rsatmalar asosida ishlaydi. Mahsulotlar, narxlar, xizmatlar haqida yozing.</p>
                    </div>
                </div>

                {/* Optional OpenAI */}
                <div className="glass border border-white/5 rounded-xl p-5 space-y-3">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-yellow-400" />
                        OpenAI API Kaliti <span className="text-xs text-gray-500 font-normal">(ixtiyoriy)</span>
                    </h3>
                    <input
                        type="password"
                        value={form.openai_api_key}
                        onChange={e => setForm(f => ({ ...f, openai_api_key: e.target.value }))}
                        placeholder="sk-..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                    />
                    <p className="text-xs text-gray-600">O'z API kalitingizdan foydalansangiz platform limitlari qo'llanilmaydi.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Yaratilmoqda...</> : 'Bot Yaratish'}
                </button>
            </form>
        </div>
    )
}
