'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, User, Phone, Search, Loader2, Calendar,
    Clock, CheckCircle, XCircle, AlertCircle, Filter, Bot
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, timeAgo } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface BotType {
    id: string
    name: string
}

const BOOKING_STATUS: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Ochique / Ожидает', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: AlertCircle },
    confirmed: { label: 'Qabul qilindi / Подтверждён', color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: CheckCircle },
    cancelled: { label: 'Rad etildi / Отменён', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
    completed: { label: 'Bajarildi / Выполнен', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: CheckCircle },
}

export default function LeadsPage() {
    const supabase = createClient()
    const { t, lang } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [bots, setBots] = useState<BotType[]>([])
    const [selectedBot, setSelectedBot] = useState<string>('all')
    const [activeTab, setActiveTab] = useState<'leads' | 'bookings'>('bookings')

    // Data
    const [leads, setLeads] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadData()
    }, [selectedBot])

    const loadData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Load Bots
        const { data: userBots } = await supabase.from('bots').select('id, name').eq('owner_id', user.id)
        setBots(userBots || [])

        const currentBotIds = selectedBot === 'all'
            ? (userBots?.map(b => b.id) || ['none'])
            : [selectedBot]

        // 2. Load Leads
        const { data: leadsData } = await supabase
            .from('leads')
            .select('*, bots(name)')
            .in('bot_id', currentBotIds.length ? currentBotIds : ['none'])
            .order('created_at', { ascending: false })

        // 3. Load Bookings
        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*, bots(name)')
            .in('bot_id', currentBotIds.length ? currentBotIds : ['none'])
            .order('booking_date', { ascending: false })
            .order('booking_time', { ascending: false })

        setLeads(leadsData || [])
        setBookings(bookingsData || [])
        setLoading(false)
    }

    const updateBookingStatus = async (bookingId: string, status: string) => {
        let reason = ''
        if (status === 'cancelled') {
            const input = prompt('Bekor qilish sababini kiriting / Введите причину отмены:')
            if (input === null) return // User cancelled
            reason = input.trim()
            if (!reason) {
                toast.error('Sababni kiritish shart! / Причина обязательна!')
                return
            }
        }

        const toastId = toast.loading('Status yangilanmoqda...')
        try {
            const res = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason })
            })
            const json = await res.json()

            if (!res.ok || json.error) throw new Error(json.error || 'Server error')

            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status, rejection_reason: reason } : b))
            toast.success('Status yangilandi', { id: toastId })
        } catch (e: any) {
            toast.error('Xatolik: ' + e.message, { id: toastId })
        }
    }

    const filteredLeads = leads.filter(l =>
        (l.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.customer_phone || '').includes(searchQuery)
    )

    const filteredBookings = bookings.filter(b =>
        (b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customer_phone || '').includes(searchQuery) ||
        (b.service_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const BOOKING_STATUS: Record<string, { label: string; color: string; icon: any }> = {
        pending: { label: t('status_pending'), color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: AlertCircle },
        confirmed: { label: t('status_confirmed'), color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: CheckCircle },
        cancelled: { label: t('status_cancelled'), color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
        completed: { label: t('status_completed'), color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: CheckCircle },
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header section Apple-style */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">{t('leads_title')}</h1>
                    <p className="text-gray-400 text-sm font-medium">{t('leads_desc')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bot className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={selectedBot}
                            onChange={(e) => setSelectedBot(e.target.value)}
                            className="bg-white/10 border border-white/10 text-white rounded-xl pl-9 pr-10 py-2.5 text-sm appearance-none outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                        >
                            <option value="all" className="bg-gray-900">{t('all_bots')}</option>
                            {bots.map(b => (
                                <option key={b.id} value={b.id} className="bg-gray-900">{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={cn('flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300', activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white')}
                    >
                        {t('bookings_tab')} ({bookings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={cn('flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300', activeTab === 'leads' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white')}
                    >
                        {t('leads_tab')} ({leads.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                </div>
            ) : activeTab === 'bookings' ? (
                /* Bookings List (Apple Cards Style) */
                <div className="grid gap-4">
                    {filteredBookings.length === 0 ? (
                        <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/10 mt-4 backdrop-blur-md">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400 font-medium">{t('no_records')}</p>
                        </div>
                    ) : (
                        filteredBookings.map(b => {
                            const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                            const StatusIcon = st.icon
                            return (
                                <div key={b.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors backdrop-blur-md shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner', st.color)}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-semibold text-white text-lg tracking-tight">{b.service_name}</h3>
                                                    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm', st.color)}>
                                                        {st.label.split('/')[0].trim()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 opacity-70" /> {b.booking_date}</span>
                                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70" /> {b.booking_time?.slice(0, 5)}</span>
                                                    <span className="flex items-center gap-1.5 text-white"><User className="w-4 h-4 opacity-70" /> {b.customer_name || 'Nomsiz'}</span>
                                                    {b.customer_phone && <a href={`tel:${b.customer_phone}`} className="flex items-center gap-1.5 text-blue-400 hover:underline"><Phone className="w-4 h-4 opacity-70" /> {b.customer_phone}</a>}
                                                </div>
                                                {selectedBot === 'all' && (
                                                    <div className="mt-2 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                        <Bot className="w-3.5 h-3.5" /> Bot: {(b as any).bots?.name || 'Noma\'lum'}
                                                    </div>
                                                )}
                                                {b.status === 'cancelled' && b.rejection_reason && (
                                                    <div className="mt-3 text-sm bg-red-500/10 text-red-400 px-3 py-2 rounded-xl border border-red-500/20 max-w-lg">
                                                        <span className="font-semibold">{lang === 'uz' ? 'Sabab:' : 'Причина:'}</span> {b.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                                            {b.status === 'confirmed' && (
                                                <>
                                                    <button onClick={() => updateBookingStatus(b.id, 'completed')} className="w-full md:w-auto px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-semibold rounded-xl transition-colors">
                                                        {t('complete')}
                                                    </button>
                                                    <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="w-full md:w-auto px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold rounded-xl transition-colors">
                                                        {t('cancel')}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            ) : (
                /* Leads List */
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm">
                    {filteredLeads.length === 0 ? (
                        <div className="p-20 text-center">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400 font-medium">{t('no_records')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('table_customer')}</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('table_phone')}</th>
                                        {selectedBot === 'all' && <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('table_bot')}</th>}
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('table_last_msg')}</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('table_time')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredLeads.map(l => (
                                        <tr key={l.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {(l.first_name?.[0] || l.telegram_username?.[0] || 'L').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">
                                                            {l.first_name ? `${l.first_name} ${l.last_name || ''}`.trim() : '#' + l.telegram_id}
                                                        </div>
                                                        {l.telegram_username && (
                                                            <div className="text-gray-500 mt-0.5">@{l.telegram_username}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {l.customer_phone ? (
                                                    <a href={`tel:${l.customer_phone}`} className="text-blue-400 hover:underline font-medium">
                                                        {l.customer_phone}
                                                    </a>
                                                ) : <span className="text-gray-600">—</span>}
                                            </td>
                                            {selectedBot === 'all' && (
                                                <td className="px-6 py-4 text-gray-400 font-medium">
                                                    {(l as any).bots?.name || '—'}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate">
                                                {l.last_message || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {timeAgo(l.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
