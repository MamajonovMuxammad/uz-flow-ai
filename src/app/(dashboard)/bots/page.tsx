'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Bot, Settings, Activity, ToggleLeft, ToggleRight, Copy, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n'

export default function BotsPage() {
    const supabase = createClient()
    const { t, lang } = useLanguage()
    const [bots, setBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadBots() }, [])

    const loadBots = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
            .from('bots')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
        setBots(data || [])
        setLoading(false)
    }

    const deleteBot = async (id: string, name: string) => {
        const msg = lang === 'uz'
            ? `Rostdan ham "${name}" botini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi va barcha ma'lumotlar o'chib ketadi.`
            : `Вы действительно хотите удалить бота "${name}"? Это действие нельзя отменить, и все данные будут потеряны.`
        if (!confirm(msg)) return

        try {
            const { error } = await supabase.from('bots').delete().eq('id', id)
            if (error) throw error
            setBots(bots.filter(b => b.id !== id))
            toast.success(lang === 'uz' ? 'Bot o\'chirildi' : 'Бот удален')
        } catch (e: any) {
            toast.error((lang === 'uz' ? 'O\'chirishda xatolik: ' : 'Ошибка удаления: ') + e.message)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">{t('bots')}</h1>
                    <p className="text-gray-400 text-sm font-medium">{lang === 'uz' ? 'Telegram botlaringizni boshqaring' : 'Управляйте вашими Telegram ботами'}</p>
                </div>
                <Link
                    href="/bots/new"
                    className="flex items-center gap-2 bg-gradient-brand text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {t('new_bot')}
                </Link>
            </div>

            {!bots?.length ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-md shadow-sm">
                    <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <Bot className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">{t('no_bot')}</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto font-medium">
                        {lang === 'uz' ? "Birinchi botingizni yarating va Telegram mijozlaringizni AI bilan avtomatlashtiring." : "Создайте своего первого бота и автоматизируйте работу с Telegram клиентами с помощью ИИ."}
                    </p>
                    <Link href="/bots/new" className="inline-flex items-center gap-2 bg-gradient-brand text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md">
                        <Plus className="w-5 h-5" />
                        {t('create_first_bot')}
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {bots.map((bot: any) => (
                        <div key={bot.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors backdrop-blur-md shadow-sm group relative">
                            {/* Delete button (absolute top right, visible on hover) */}
                            <button
                                onClick={() => deleteBot(bot.id, bot.name)}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all z-10"
                                title={lang === 'uz' ? "O'chirish" : "Удалить"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-inner shrink-0">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3 className="font-semibold text-white text-lg tracking-tight truncate pr-6">{bot.name}</h3>
                                    {bot.bot_username ? (
                                        <p className="text-sm text-gray-400 truncate">@{bot.bot_username}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500">{lang === 'uz' ? 'Username yo\'q' : 'Без юзернейма'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Context Preview */}
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2 leading-relaxed h-10">
                                {bot.ai_prompt_context || (lang === 'uz' ? 'AI kontekst sozlanmagan' : 'AI контекст не настроен')}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center justify-between mb-6 bg-white/5 rounded-2xl p-3 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${bot.is_active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`}></span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${bot.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                                        {bot.is_active ? t('active') : t('inactive')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                                        <Activity className="w-3.5 h-3.5" />
                                        {bot.language === 'auto' ? 'UZ/RU' : bot.language.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/bots/${bot.id}/settings`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    {t('settings')}
                                </Link>
                                {bot.bot_username && (
                                    <a
                                        href={`https://t.me/${bot.bot_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                        title={lang === 'uz' ? "Telegram'da ochish" : "Открыть в Telegram"}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

