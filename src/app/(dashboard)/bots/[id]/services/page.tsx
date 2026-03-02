'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Trash2, Save,
    Loader2, Package, Clock, DollarSign, ToggleLeft, ToggleRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Service {
    id?: string
    name: string
    description: string
    price: number
    duration_minutes: number
    is_active: boolean
}

export default function ServicesPage() {
    const { id: botId } = useParams<{ id: string }>()
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadServices() }, [botId])

    const loadServices = async () => {
        try {
            const res = await fetch(`/api/bot/${botId}/services`)
            const json = await res.json()
            if (json.error) { toast.error(json.error); return }
            setServices(json.data || [])
        } catch (e) {
            toast.error('Yuklashda xatolik')
        } finally {
            setLoading(false)
        }
    }

    const addService = () => {
        setServices([...services, {
            name: '',
            description: '',
            price: 50000,
            duration_minutes: 60,
            is_active: true,
        }])
    }

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index))
        toast.success('Xizmat o\'chirildi (saqlash tugmasini bosing)')
    }

    const updateService = (index: number, field: string, value: any) => {
        const updated = [...services]
            ; (updated[index] as any)[field] = value
        setServices(updated)
    }

    const saveAll = async () => {
        const valid = services.filter(s => s.name.trim())
        if (valid.length === 0) {
            toast.error('Kamida bitta xizmat nomini kiriting')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/bot/${botId}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: valid }),
            })
            const json = await res.json()
            if (json.error) {
                toast.error('Xatolik: ' + json.error)
            } else {
                toast.success(`${json.count} ta xizmat saqlandi! ✅`)
                await loadServices()
            }
        } catch (e) {
            toast.error('Server xatoligi')
        } finally {
            setSaving(false)
        }
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
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-400" />
                        Xizmatlar / Услуги
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">Narxlar va davomiylik</p>
                </div>
                <button onClick={addService}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                    <Plus className="w-4 h-4" /> Qo'shish
                </button>
            </div>

            {services.length === 0 ? (
                <div className="glass border border-white/5 rounded-xl p-12 text-center">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">Xizmatlar hali qo'shilmagan</p>
                    <p className="text-gray-600 text-sm mb-4">Услуги ещё не добавлены</p>
                    <button onClick={addService}
                        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gradient-brand text-white text-sm font-medium">
                        <Plus className="w-4 h-4" /> Birinchi xizmatni qo'shing
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((svc, i) => (
                        <div key={i} className={cn(
                            'glass border rounded-xl p-4 space-y-3 transition-all',
                            svc.is_active ? 'border-white/10' : 'border-white/5 opacity-50'
                        )}>
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                <input type="text" value={svc.name}
                                    onChange={e => updateService(i, 'name', e.target.value)}
                                    placeholder="Xizmat nomi / Название"
                                    className="flex-1 bg-transparent border-none text-white text-sm font-medium focus:outline-none placeholder:text-gray-600" />
                                <button onClick={() => updateService(i, 'is_active', !svc.is_active)}
                                    className="shrink-0" title={svc.is_active ? 'O\'chirish' : 'Yoqish'}>
                                    {svc.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                                </button>
                                <button onClick={() => removeService(i)}
                                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0" title="O'chirish">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <input type="text" value={svc.description}
                                onChange={e => updateService(i, 'description', e.target.value)}
                                placeholder="Tavsif / Описание (по желанию)"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-xs focus:border-purple-500/50 transition-all" />

                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Narx (so'm)</label>
                                    <input type="number" value={svc.price}
                                        onChange={e => updateService(i, 'price', parseInt(e.target.value) || 0)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500/50 transition-all" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Davomiylik (daq)</label>
                                    <input type="number" value={svc.duration_minutes}
                                        onChange={e => updateService(i, 'duration_minutes', parseInt(e.target.value) || 30)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500/50 transition-all" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {services.length > 0 && (
                <button onClick={saveAll} disabled={saving}
                    className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</> : <><Save className="w-4 h-4" /> Saqlash ({services.length} ta xizmat)</>}
                </button>
            )}
        </div>
    )
}
