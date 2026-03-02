'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Save, Loader2, Clock, Calendar,
    ToggleLeft, ToggleRight, CalendarX
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DAYS = [
    { dow: 0, uz: 'Dushanba', ru: 'Понедельник' },
    { dow: 1, uz: 'Seshanba', ru: 'Вторник' },
    { dow: 2, uz: 'Chorshanba', ru: 'Среда' },
    { dow: 3, uz: 'Payshanba', ru: 'Четверг' },
    { dow: 4, uz: 'Juma', ru: 'Пятница' },
    { dow: 5, uz: 'Shanba', ru: 'Суббота' },
    { dow: 6, uz: 'Yakshanba', ru: 'Воскресенье' },
]

interface ScheduleRow {
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
    is_working: boolean
    slot_duration_minutes: number
}

export default function SchedulePage() {
    const { id: botId } = useParams<{ id: string }>()
    const supabase = createClient()
    const [schedule, setSchedule] = useState<ScheduleRow[]>([])
    const [blockedDates, setBlockedDates] = useState<{ id?: string; blocked_date: string; reason: string }[]>([])
    const [newBlockedDate, setNewBlockedDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [botId])

    const loadData = async () => {
        // Load schedule
        const { data: sched } = await supabase
            .from('bot_schedule')
            .select('*')
            .eq('bot_id', botId)
            .order('day_of_week')

        // Initialize all 7 days
        const schedMap = new Map((sched || []).map((s: any) => [s.day_of_week, s]))
        const fullSchedule: ScheduleRow[] = DAYS.map(d => schedMap.get(d.dow) || {
            day_of_week: d.dow,
            start_time: '10:00',
            end_time: '18:00',
            is_working: d.dow < 5, // Mon-Fri working by default
            slot_duration_minutes: 60,
        })
        setSchedule(fullSchedule)

        // Load blocked dates
        const { data: blocked } = await supabase
            .from('bot_blocked_dates')
            .select('*')
            .eq('bot_id', botId)
            .order('blocked_date')
        setBlockedDates(blocked || [])

        setLoading(false)
    }

    const updateDay = (dow: number, field: string, value: any) => {
        setSchedule(s => s.map(row => row.day_of_week === dow ? { ...row, [field]: value } : row))
    }

    const addBlockedDate = async () => {
        if (!newBlockedDate) return
        const { data } = await supabase.from('bot_blocked_dates').insert({
            bot_id: botId,
            blocked_date: newBlockedDate,
            reason: 'Выходной',
        }).select().single()
        if (data) {
            setBlockedDates([...blockedDates, data])
            setNewBlockedDate('')
            toast.success('Kun bloklandi')
        }
    }

    const removeBlockedDate = async (id: string) => {
        await supabase.from('bot_blocked_dates').delete().eq('id', id)
        setBlockedDates(blockedDates.filter(d => d.id !== id))
    }

    const saveSchedule = async () => {
        setSaving(true)
        for (const row of schedule) {
            if (row.id) {
                await supabase.from('bot_schedule').update({
                    start_time: row.start_time,
                    end_time: row.end_time,
                    is_working: row.is_working,
                    slot_duration_minutes: row.slot_duration_minutes,
                }).eq('id', row.id)
            } else {
                const { data } = await supabase.from('bot_schedule').upsert({
                    bot_id: botId,
                    day_of_week: row.day_of_week,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    is_working: row.is_working,
                    slot_duration_minutes: row.slot_duration_minutes,
                }, { onConflict: 'bot_id,day_of_week' }).select().single()
                if (data) {
                    setSchedule(s => s.map(r => r.day_of_week === row.day_of_week ? data : r))
                }
            }
        }
        toast.success('Jadval saqlandi!')
        setSaving(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href={`/bots/${botId}/settings`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Ish jadvali / Расписание
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">Ish kunlari va soatlari / Рабочие дни и часы</p>
                </div>
            </div>

            {/* Weekly Schedule */}
            <div className="glass border border-white/5 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Haftalik jadval / Недельное расписание
                </h3>

                {schedule.map(row => {
                    const day = DAYS.find(d => d.dow === row.day_of_week)!
                    return (
                        <div key={row.day_of_week} className={cn(
                            'flex items-center gap-3 p-3 rounded-xl transition-all',
                            row.is_working ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'
                        )}>
                            <button onClick={() => updateDay(row.day_of_week, 'is_working', !row.is_working)}
                                className="shrink-0">
                                {row.is_working ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                            </button>
                            <span className="w-24 text-sm text-gray-300 font-medium shrink-0">
                                {day.uz} <span className="text-gray-600 text-xs">/ {day.ru}</span>
                            </span>
                            {row.is_working ? (
                                <>
                                    <input type="time" value={row.start_time}
                                        onChange={e => updateDay(row.day_of_week, 'start_time', e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs w-24" />
                                    <span className="text-gray-600 text-xs">—</span>
                                    <input type="time" value={row.end_time}
                                        onChange={e => updateDay(row.day_of_week, 'end_time', e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs w-24" />
                                    <select value={row.slot_duration_minutes}
                                        onChange={e => updateDay(row.day_of_week, 'slot_duration_minutes', parseInt(e.target.value))}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs ml-auto">
                                        <option value={30}>30 daq</option>
                                        <option value={60}>1 soat</option>
                                        <option value={90}>1.5 soat</option>
                                        <option value={120}>2 soat</option>
                                    </select>
                                </>
                            ) : (
                                <span className="text-gray-600 text-xs italic">Dam olish kuni / Выходной</span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Blocked Dates */}
            <div className="glass border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <CalendarX className="w-4 h-4 text-red-400" />
                    Bloklangan kunlar / Заблокированные даты
                </h3>
                <div className="flex gap-2">
                    <input type="date" value={newBlockedDate}
                        onChange={e => setNewBlockedDate(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                    <button onClick={addBlockedDate}
                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                        Bloklash
                    </button>
                </div>
                {blockedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {blockedDates.map(bd => (
                            <span key={bd.id} className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                                📅 {bd.blocked_date}
                                <button onClick={() => bd.id && removeBlockedDate(bd.id)} className="ml-1 hover:text-white">×</button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 text-xs">Hech qanday kun bloklanmagan / Нет заблокированных дат</p>
                )}
            </div>

            <button onClick={saveSchedule} disabled={saving}
                className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</> : <><Save className="w-4 h-4" /> Saqlash</>}
            </button>
        </div>
    )
}
