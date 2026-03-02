'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Bot, Key, CreditCard, Globe,
    Loader2, Save, Copy, Check, AlertCircle, ExternalLink,
    ToggleLeft, ToggleRight, Settings, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

export default function BotSettingsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()
    const { lang } = useLanguage()
    const [bot, setBot] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activating, setActivating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    useEffect(() => {
        loadBot()
    }, [id])

    const loadBot = async () => {
        const { data, error } = await supabase.from('bots').select('*').eq('id', id).single()
        if (error || !data) { router.push('/bots'); return }
        setBot(data)
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase.from('bots').update({
            name: bot.name,
            welcome_message: bot.welcome_message,
            ai_prompt_context: bot.ai_prompt_context,
            language: bot.language,
            openai_api_key: bot.openai_api_key || null,
            click_merchant_id: bot.click_merchant_id || null,
            click_service_id: bot.click_service_id || null,
            click_secret_key: bot.click_secret_key || null,
            payme_merchant_id: bot.payme_merchant_id || null,
            payme_secret_key: bot.payme_secret_key || null,
        }).eq('id', id)

        if (error) toast.error(lang === 'uz' ? 'Saqlashda xatolik' : 'Ошибка при сохранении')
        else toast.success(lang === 'uz' ? 'Saqlandi!' : 'Сохранено!')
        setSaving(false)
    }

    const handleActivate = async () => {
        setActivating(true)
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
            if (!appUrl || appUrl.startsWith('http://localhost')) {
                toast.error(lang === 'uz' ? 'NEXT_PUBLIC_APP_URL HTTPS havola bo\'lishi kerak (localtunnel ishlating)' : 'NEXT_PUBLIC_APP_URL должен быть HTTPS ссылкой (запустите localtunnel)')
                setActivating(false)
                return
            }
            const webhookUrl = `${appUrl}/api/telegram/webhook/${id}`
            console.log('Setting webhook to:', webhookUrl)

            const res = await fetch('/api/telegram/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId: id, botToken: bot.bot_token, webhookUrl }),
            })
            const result = await res.json()

            if (result.ok) {
                await supabase.from('bots').update({ is_active: true, webhook_url: webhookUrl }).eq('id', id)
                setBot((b: any) => ({ ...b, is_active: true, webhook_url: webhookUrl }))
                toast.success(lang === 'uz' ? 'Bot faollashtirildi! Webhook o\'rnatildi.' : 'Бот активирован! Webhook установлен.')
            } else {
                toast.error((lang === 'uz' ? 'Faollashtirishda xatolik: ' : 'Ошибка активации: ') + result.description)
            }
        } catch (err) {
            toast.error(lang === 'uz' ? 'Server xatoligi' : 'Ошибка сервера')
        } finally {
            setActivating(false)
        }
    }

    const handleDeactivate = async () => {
        setActivating(true)
        await supabase.from('bots').update({ is_active: false }).eq('id', id)
        setBot((b: any) => ({ ...b, is_active: false }))
        toast.success(lang === 'uz' ? 'Bot to\'xtatildi' : 'Бот остановлен')
        setActivating(false)
    }

    const getWebhookUrl = () => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        return `${appUrl}/api/telegram/webhook/${id}`
    }

    const copyWebhook = () => {
        navigator.clipboard.writeText(getWebhookUrl())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    )

    const tabs = ['general', 'ai', 'payments', 'webhook']
    const tabLabels: Record<string, string> = {
        general: lang === 'uz' ? 'Umumiy' : 'Основное',
        ai: 'AI',
        payments: lang === 'uz' ? 'To\'lov' : 'Оплата',
        webhook: 'Webhook'
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/bots" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">{bot.name}</h1>
                    <p className="text-gray-500 text-xs mt-0.5">{lang === 'uz' ? 'Bot sozlamalari' : 'Настройки бота'}</p>
                </div>
                {/* Status Toggle */}
                <button
                    onClick={bot.is_active ? handleDeactivate : handleActivate}
                    disabled={activating}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        bot.is_active
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                            : 'bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                    )}
                >
                    {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        bot.is_active ? <><span className="status-dot active"></span> {lang === 'uz' ? 'Faol' : 'Активен'}</> : <><Zap className="w-4 h-4" /> {lang === 'uz' ? 'Faollashtirish' : 'Активировать'}</>
                    )}
                </button>
            </div>

            {/* Quick Links - Management Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Link href={`/bots/${id}/services`}
                    className="glass border border-white/10 rounded-xl p-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                    <div className="text-2xl mb-2">🛍</div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300">{lang === 'uz' ? 'Xizmatlar' : 'Услуги и цены'}</h3>
                    <p className="text-xs text-gray-500">{lang === 'uz' ? 'Narxlar va xizmatlar' : 'Услуги и цены'}</p>
                </Link>
                <Link href={`/bots/${id}/schedule`}
                    className="glass border border-white/10 rounded-xl p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                    <div className="text-2xl mb-2">⏰</div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-300">{lang === 'uz' ? 'Ish jadvali' : 'Расписание'}</h3>
                    <p className="text-xs text-gray-500">{lang === 'uz' ? 'Vaqtlar va kunlar' : 'Расписание'}</p>
                </Link>
                <Link href={`/bots/${id}/menu`}
                    className="glass border border-white/10 rounded-xl p-4 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group">
                    <div className="text-2xl mb-2">🔘</div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-orange-300">{lang === 'uz' ? 'Menyu tugmalari' : 'Кнопки бота'}</h3>
                    <p className="text-xs text-gray-500">{lang === 'uz' ? 'Asosiy navigatsiya' : 'Кнопки бота'}</p>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 glass border border-white/5 rounded-xl p-1">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                            activeTab === tab ? 'bg-gradient-brand text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Bot nomi' : 'Имя бота'}</label>
                        <input type="text" value={bot.name} onChange={e => setBot((b: any) => ({ ...b, name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Til' : 'Язык'}</label>
                        <select value={bot.language} onChange={e => setBot((b: any) => ({ ...b, language: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all">
                            <option className="bg-gray-900" value="auto">{lang === 'uz' ? 'Avtomatik (UZ/RU)' : 'Автоматически (UZ/RU)'}</option>
                            <option className="bg-gray-900" value="uz">{lang === 'uz' ? 'Faqat O\'zbekcha' : 'Только узбекский'}</option>
                            <option className="bg-gray-900" value="ru">{lang === 'uz' ? 'Faqat Ruscha' : 'Только русский'}</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Xush kelibsiz xabari' : 'Приветственное сообщение'}</label>
                        <textarea value={bot.welcome_message} onChange={e => setBot((b: any) => ({ ...b, welcome_message: e.target.value }))}
                            rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all resize-none" />
                    </div>
                </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
                <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">AI System Prompt</label>
                        <textarea value={bot.ai_prompt_context} onChange={e => setBot((b: any) => ({ ...b, ai_prompt_context: e.target.value }))}
                            rows={8} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all resize-none" />
                        <p className="text-xs text-gray-600">{lang === 'uz' ? 'Bu prompt AI-ning asosiy ko\'rsatmasi. Mahsulotlar, narxlar, xizmatlar, soatlar haqida yozing.' : 'Это основная инструкция для ИИ. Опишите продукты, цены, услуги, часы работы.'}</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">OpenAI API Kaliti <span className="text-gray-600">{lang === 'uz' ? '(ixtiyoriy)' : '(необязательно)'}</span></label>
                        <input type="password" value={bot.openai_api_key || ''} onChange={e => setBot((b: any) => ({ ...b, openai_api_key: e.target.value }))}
                            placeholder="sk-..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-purple-500/50 transition-all" />
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
                <div className="space-y-4">
                    <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            Click To'lov
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">Merchant ID</label>
                                <input type="text" value={bot.click_merchant_id || ''} onChange={e => setBot((b: any) => ({ ...b, click_merchant_id: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">Service ID</label>
                                <input type="text" value={bot.click_service_id || ''} onChange={e => setBot((b: any) => ({ ...b, click_service_id: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400">Secret Key</label>
                            <input type="password" value={bot.click_secret_key || ''} onChange={e => setBot((b: any) => ({ ...b, click_secret_key: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 transition-all" />
                        </div>
                    </div>

                    <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-400" />
                            Payme To'lov
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">Merchant ID</label>
                                <input type="text" value={bot.payme_merchant_id || ''} onChange={e => setBot((b: any) => ({ ...b, payme_merchant_id: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">Secret Key</label>
                                <input type="password" value={bot.payme_secret_key || ''} onChange={e => setBot((b: any) => ({ ...b, payme_secret_key: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500/50 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Webhook Tab */}
            {activeTab === 'webhook' && (
                <div className="glass border border-white/5 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-400" />
                        Webhook URL
                    </h3>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono truncate">
                            {getWebhookUrl()}
                        </div>
                        <button onClick={copyWebhook} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        {lang === 'uz' ? 'Bot faollashtirish tugmasini bossangiz, bu URL avtomatik Telegram serverlariga o\'rnatiladi.' : 'Если нажать кнопку активации, этот URL автоматически установится на серверах Telegram.'}
                        {lang === 'uz' ? ' Bot ' : ' Бот '}
                        {bot.is_active ? <span className="text-green-400">{lang === 'uz' ? 'faol' : 'активен'}</span> : <span className="text-gray-400">{lang === 'uz' ? 'faol emas' : 'не активен'}</span>}.
                    </p>
                </div>
            )}

            <button onClick={handleSave} disabled={saving}
                className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'uz' ? 'Saqlanmoqda...' : 'Сохранение...'}</> : <><Save className="w-4 h-4" /> {lang === 'uz' ? 'Saqlash' : 'Сохранить'}</>}
            </button>
        </div>
    )
}
