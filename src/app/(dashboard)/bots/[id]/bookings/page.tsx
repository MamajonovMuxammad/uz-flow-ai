'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Loader2, Calendar, User, Phone,
    Clock, CheckCircle, XCircle, AlertCircle, Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Booking {
    id: string
    customer_name: string
    customer_phone: string
    service_name: string
    booking_date: string
    booking_time: string
    status: string
    created_at: string
    telegram_id: number
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Kutilmoqda / Ожидает', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: AlertCircle },
    confirmed: { label: 'Tasdiqlangan / Подтверждён', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle },
    cancelled: { label: 'Bekor qilingan / Отменён', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
    completed: { label: 'Bajarilgan / Выполнен', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle },
}

export default function BookingsPage() {
    const { id: botId } = useParams<{ id: string }>()
    const supabase = createClient()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => { loadBookings() }, [botId])

    const loadBookings = async () => {
        const { data } = await supabase
            .from('bookings')
            .select('*')
            .eq('bot_id', botId)
            .order('booking_date', { ascending: false })
            .order('booking_time', { ascending: false })
            .limit(100)
        setBookings(data || [])
        setLoading(false)
    }

    const updateStatus = async (bookingId: string, status: string) => {
        let reason = ''
        if (status === 'cancelled') {
            const input = prompt('Bekor qilish sababini kiriting / Введите причину отмены:')
            if (input === null) return // User cancelled the prompt
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

            if (!res.ok || json.error) {
                throw new Error(json.error || 'Tarmoq xatosi')
            }

            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status, rejection_reason: reason } : b))
            toast.success('Status yangilandi va mijozga xabar yuborildi', { id: toastId })
        } catch (e: any) {
            toast.error('Xatolik: ' + e.message, { id: toastId })
        }
    }

    const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href={`/bots/${botId}/settings`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        Yozilishlar / Записи
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">{bookings.length} ta yozilish / записей</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                            filter === f ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        )}>
                        {f === 'all' ? `Hammasi (${bookings.length})` : `${STATUS_LABELS[f]?.label?.split('/')[0]} (${bookings.filter(b => b.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Bookings list */}
            {filtered.length === 0 ? (
                <div className="glass border border-white/5 rounded-xl p-10 text-center">
                    <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Yozilishlar yo'q / Записей нет</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(b => {
                        const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending
                        const StatusIcon = st.icon
                        return (
                            <div key={b.id} className="glass border border-white/5 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', st.color)}>
                                        <StatusIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white text-sm">{b.service_name}</span>
                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', st.color)}>
                                                {st.label.split('/')[0].trim()}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.booking_date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.booking_time?.slice(0, 5)}</span>
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {b.customer_name || 'Nomsiz'}</span>
                                            {b.customer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {b.customer_phone}</span>}
                                        </div>
                                        {b.status === 'cancelled' && (b as any).rejection_reason && (
                                            <div className="mt-2 text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 inline-block">
                                                Sabab / Причина: {(b as any).rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                    {/* Status actions */}
                                    <div className="flex gap-1 shrink-0">
                                        {b.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateStatus(b.id, 'confirmed')}
                                                    className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Tasdiqlash">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => updateStatus(b.id, 'cancelled')}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Bekor qilish">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {b.status === 'confirmed' && (
                                            <button onClick={() => updateStatus(b.id, 'completed')}
                                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Bajarildi">
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
