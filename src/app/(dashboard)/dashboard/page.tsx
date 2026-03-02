'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    MessageSquare, Users, TrendingUp, Bot,
    ArrowUpRight, ArrowRight, Plus, Zap, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { timeAgo, formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

export default function DashboardPage() {
    const supabase = createClient()
    const { t, lang } = useLanguage()

    const [loading, setLoading] = useState(true)
    const [statsResult, setStatsResult] = useState({
        totalBots: 0,
        activeBots: 0,
        totalLeads: 0,
        newLeads: 0,
        totalRevenue: 0,
        recentLeads: [] as any[],
        bots: [] as any[]
    })

    useEffect(() => {
        const loadStats = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: userBots } = await supabase.from('bots').select('id, name, is_active').eq('owner_id', user.id)
            const botIds = userBots?.map(b => b.id) || ['none']

            const [leadsData, paymentsData, recentLeadsData] = await Promise.all([
                supabase.from('leads').select('id, status', { count: 'exact' }).in('bot_id', botIds),
                supabase.from('payments').select('amount, status').in('bot_id', botIds).eq('status', 'paid'),
                supabase.from('leads').select('*, bots(name)').in('bot_id', botIds).order('created_at', { ascending: false }).limit(5),
            ])

            setStatsResult({
                totalBots: userBots?.length || 0,
                activeBots: userBots?.filter(b => b.is_active).length || 0,
                totalLeads: leadsData.count || 0,
                newLeads: leadsData.data?.filter(l => l.status === 'new').length || 0,
                totalRevenue: paymentsData.data?.reduce((sum, p) => sum + p.amount, 0) || 0,
                recentLeads: recentLeadsData.data || [],
                bots: userBots || []
            })
            setLoading(false)
        }
        loadStats()
    }, [])

    const { totalBots, activeBots, totalLeads, newLeads, totalRevenue, recentLeads, bots } = statsResult

    const stats = [
        {
            label: lang === 'uz' ? 'Jami Suhbatlar' : 'Все диалоги',
            value: totalLeads.toLocaleString(),
            sub: lang === 'uz' ? `${newLeads} ta yangi` : `${newLeads} новых`,
            icon: MessageSquare,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20',
            trend: '',
        },
        {
            label: lang === 'uz' ? 'Yangi Lidlar' : 'Новые Лиды',
            value: newLeads.toLocaleString(),
            sub: lang === 'uz' ? 'Bu oy' : 'За месяц',
            icon: Users,
            color: 'text-green-400',
            bg: 'bg-green-400/10',
            border: 'border-green-400/20',
            trend: '',
        },
        {
            label: lang === 'uz' ? 'Daromad (UZS)' : 'Доход (UZS)',
            value: formatCurrency(totalRevenue / 100),
            sub: 'Click + Payme',
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20',
            trend: '',
        },
        {
            label: lang === 'uz' ? 'Faol Botlar' : 'Активные Боты',
            value: `${activeBots}/${totalBots}`,
            sub: lang === 'uz' ? 'ishlayapti' : 'работают',
            icon: Bot,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
            border: 'border-orange-400/20',
            trend: '',
        },
    ]

    const statusColors: Record<string, string> = {
        new: 'badge-new',
        contacted: 'badge-contacted',
        qualified: 'badge-qualified',
        converted: 'badge-converted',
        lost: 'badge-lost',
    }

    const statusLabels: Record<string, string> = {
        new: 'Yangi',
        contacted: 'Bog\'landi',
        qualified: 'Malumotli',
        converted: 'Xaridor',
        lost: 'Lost',
    }

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 opacity-20 animate-spin" /></div>

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{lang === 'uz' ? 'Bosh sahifa' : 'Главная'}</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{lang === 'uz' ? 'Biznesingizning umumiy ko\'rinishi' : 'Обзор вашего бизнеса'}</p>
                </div>
                <Link
                    href="/bots/new"
                    className="flex items-center gap-2 bg-gradient-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    {lang === 'uz' ? 'Yangi Bot' : 'Новый Бот'}
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card glass border ${stat.border} rounded-xl p-5`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            {stat.trend && (
                                <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                        <div className="text-xs text-gray-400">{stat.label}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Leads */}
                <div className="lg:col-span-2 glass border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between p-5 border-b border-white/5">
                        <h3 className="font-semibold text-white">{lang === 'uz' ? 'So\'nggi Lidlar' : 'Последние Лиды'}</h3>
                        <Link href="/leads" className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition-colors">
                            {lang === 'uz' ? 'Barchasi' : 'Все'} <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {recentLeads.length === 0 ? (
                        <div className="p-10 text-center">
                            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">{lang === 'uz' ? 'Hali lidlar yo\'q' : 'Пока нет лидов'}</p>
                            <p className="text-gray-600 text-xs mt-1">{lang === 'uz' ? 'Bot yarating va mijozlarni jalb qiling' : 'Создайте бота и начните получать клиентов'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {recentLeads.map((lead: any) => (
                                <div key={lead.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {(lead.first_name?.[0] || lead.telegram_username?.[0] || 'L').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-sm truncate">
                                            {lead.first_name ? `${lead.first_name} ${lead.last_name || ''}`.trim() : lead.telegram_username || (lang === 'uz' ? `Foydalanuvchi #${lead.telegram_id}` : `Пользователь #${lead.telegram_id}`)}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{lead.last_message || (lang === 'uz' ? 'Xabar yo\'q' : 'Нет сообщений')}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status]}`}>
                                            {statusLabels[lead.status]}
                                        </span>
                                        <span className="text-xs text-gray-600">{timeAgo(lead.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions + Bot Status */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="glass border border-white/5 rounded-xl p-5">
                        <h3 className="font-semibold text-white mb-4">{lang === 'uz' ? 'Tez Harakatlar' : 'Быстрые действия'}</h3>
                        <div className="space-y-2">
                            {[
                                { label: lang === 'uz' ? 'Yangi bot yaratish' : 'Создать нового бота', href: '/bots/new', icon: Bot, color: 'text-purple-400' },
                                { label: lang === 'uz' ? 'Bilim qo\'shish' : 'Добавить знания', href: '/knowledge', icon: Zap, color: 'text-blue-400' },
                                { label: lang === 'uz' ? 'Lidlarni ko\'rish' : 'Посмотреть лидов', href: '/leads', icon: Users, color: 'text-green-400' },
                            ].map((action, i) => (
                                <Link
                                    key={i}
                                    href={action.href}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/6 border border-white/5 transition-all group"
                                >
                                    <action.icon className={`w-4 h-4 ${action.color}`} />
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
                                    <ArrowRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Bots Status */}
                    <div className="glass border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white">{lang === 'uz' ? 'Botlar' : 'Боты'}</h3>
                            <Link href="/bots" className="text-purple-400 text-xs hover:text-purple-300 transition-colors">{lang === 'uz' ? 'Barchasi' : 'Все'}</Link>
                        </div>
                        {totalBots === 0 ? (
                            <div className="text-center py-4">
                                <Bot className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{lang === 'uz' ? 'Bot yo\'q' : 'Ботов нет'}</p>
                                <Link href="/bots/new" className="text-purple-400 text-xs hover:text-purple-300 transition-colors">
                                    + {lang === 'uz' ? 'Yaratish' : 'Создать'}
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bots.slice(0, 4).map((bot: any) => (
                                    <div key={bot.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3">
                                        <span className={`status-dot ${bot.is_active ? 'active' : 'inactive'}`}></span>
                                        <span className="text-sm text-gray-300 flex-1 truncate">{bot.name || 'Bot'}</span>
                                        <span className={`text-xs ${bot.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                                            {bot.is_active ? (lang === 'uz' ? 'Faol' : 'Активен') : (lang === 'uz' ? 'To\'xtatilgan' : 'Остановлен')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
