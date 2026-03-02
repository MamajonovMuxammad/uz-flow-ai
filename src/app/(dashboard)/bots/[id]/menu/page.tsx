'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Trash2, Save, Loader2,
    ToggleLeft, ToggleRight, MousePointerClick
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const EMOJIS = ['📌', '🛍', '📅', '💰', '📞', '❓', '📋', '🎓', '💇‍♀️', '🏠', '🔧', '🚀', '💊', '🍕', '📸', '✈️', '🎉', '📦', '🔔', '💬', '🎯', '💎', '🔥', '⭐']
const ACTIONS = [
    { value: 'text', label: 'Matn / Текст', desc: 'Bot matn javob beradi' },
    { value: 'services', label: 'Xizmatlar / Услуги', desc: 'Avtomatik xizmatlar ro\'yxati' },
    { value: 'booking', label: 'Yozilish / Запись', desc: 'Xizmatga yozilish oynasi' },
    { value: 'contact', label: 'Kontakt / Контакт', desc: 'Telefon raqamini so\'raydi' },
    { value: 'link', label: 'Havola / Ссылка', desc: 'URL yoki matn yuboradi' },
]

interface MenuButton {
    id?: string
    label: string
    emoji: string
    action: string
    action_value: string
    is_active: boolean
}

export default function MenuBuilderPage() {
    const { id: botId } = useParams<{ id: string }>()
    const [buttons, setButtons] = useState<MenuButton[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadButtons() }, [botId])

    const loadButtons = async () => {
        try {
            const res = await fetch(`/api/bot/${botId}/menu`)
            const json = await res.json()
            if (json.error) { toast.error(json.error); return }
            setButtons(json.data || [])
        } catch (e) {
            toast.error('Yuklashda xatolik')
        } finally {
            setLoading(false)
        }
    }

    const addButton = () => {
        setButtons([...buttons, {
            label: '',
            emoji: '📌',
            action: 'text',
            action_value: '',
            is_active: true,
        }])
    }

    const removeButton = (index: number) => {
        setButtons(buttons.filter((_, i) => i !== index))
        toast.success('Tugma o\'chirildi (saqlash tugmasini bosing)')
    }

    const updateButton = (index: number, field: string, value: any) => {
        const updated = [...buttons]
            ; (updated[index] as any)[field] = value
        setButtons(updated)
    }

    const saveAll = async () => {
        const valid = buttons.filter(b => b.label.trim())
        if (valid.length === 0 && buttons.length > 0) {
            toast.error('Kamida bitta tugma nomini kiriting')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/bot/${botId}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buttons: valid }),
            })
            const json = await res.json()
            if (json.error) {
                toast.error('Xatolik: ' + json.error)
            } else {
                toast.success(`${json.count} ta tugma saqlandi! ✅`)
                await loadButtons()
            }
        } catch (e) {
            toast.error('Server xatoligi')
        } finally {
            setSaving(false)
        }
    }

    // Удалить все кнопки
    const clearAll = async () => {
        setSaving(true)
        try {
            await fetch(`/api/bot/${botId}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buttons: [] }),
            })
            setButtons([])
            toast.success('Barcha tugmalar o\'chirildi ✅')
        } catch (e) {
            toast.error('Xatolik')
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
                        <MousePointerClick className="w-5 h-5 text-orange-400" />
                        Menyu tugmalari
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">/start buyrug'ida chiqadigan tugmalar</p>
                </div>
                <button onClick={addButton}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                    <Plus className="w-4 h-4" /> Qo'shish
                </button>
            </div>

            {/* Preview */}
            <div className="glass border border-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">📱 Telegram ko'rinishi:</p>
                <div className="bg-[#1a2236] rounded-xl p-4 max-w-xs mx-auto">
                    <p className="text-sm text-white mb-3">👋 Assalomu alaykum!</p>
                    <div className="space-y-1.5">
                        {buttons.filter(b => b.is_active && b.label).length > 0 ? (
                            buttons.filter(b => b.is_active && b.label).map((btn, i) => (
                                <div key={i} className="bg-[#3390ec] text-white text-center text-sm py-1.5 rounded-lg">
                                    {btn.emoji} {btn.label}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-xs text-center py-2">Tugmalar qo'shilmagan — faqat matn chiqadi</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                💡 Tugmalar qo'shgandan keyin "Saqlash" tugmasini bosing. Keyin Telegram botda /start bosib tekshiring.
            </div>

            {/* Buttons editor */}
            {buttons.length === 0 ? (
                <div className="glass border border-white/5 rounded-xl p-10 text-center">
                    <MousePointerClick className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">Tugmalar yo'q</p>
                    <p className="text-gray-600 text-xs mb-3">Bot faqat matn bilan javob beradi</p>
                    <button onClick={addButton}
                        className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-brand text-white text-sm font-medium">
                        <Plus className="w-4 h-4" /> Birinchi tugma
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {buttons.map((btn, i) => (
                        <div key={i} className={cn(
                            'glass border rounded-xl p-4 space-y-3 transition-all',
                            btn.is_active ? 'border-white/10' : 'border-white/5 opacity-50'
                        )}>
                            <div className="flex items-center gap-2">
                                {/* Emoji */}
                                <select value={btn.emoji} onChange={e => updateButton(i, 'emoji', e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-lg w-14 text-center shrink-0">
                                    {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>

                                {/* Label */}
                                <input type="text" value={btn.label}
                                    onChange={e => updateButton(i, 'label', e.target.value)}
                                    placeholder="Tugma matni..."
                                    className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-gray-600" />

                                {/* Toggle */}
                                <button onClick={() => updateButton(i, 'is_active', !btn.is_active)} className="shrink-0">
                                    {btn.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                                </button>

                                {/* Delete */}
                                <button onClick={() => removeButton(i)}
                                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Action type */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Harakat turi:</label>
                                <select value={btn.action} onChange={e => updateButton(i, 'action', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs">
                                    {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-600">{ACTIONS.find(a => a.value === btn.action)?.desc}</p>
                            </div>

                            {/* Value */}
                            {(btn.action === 'text' || btn.action === 'link') && (
                                <textarea
                                    value={btn.action_value}
                                    onChange={e => updateButton(i, 'action_value', e.target.value)}
                                    placeholder={btn.action === 'link' ? 'https://...' : 'Javob matni...'}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-xs focus:border-purple-500/50 transition-all resize-none"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Action buttons */}
            {buttons.length > 0 && (
                <div className="flex gap-3">
                    <button onClick={clearAll} disabled={saving}
                        className="px-4 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4 inline mr-1" /> Hammasini o'chirish
                    </button>
                    <button onClick={saveAll} disabled={saving}
                        className="flex-1 bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</> : <><Save className="w-4 h-4" /> Saqlash ({buttons.length} ta tugma)</>}
                    </button>
                </div>
            )}
        </div>
    )
}
