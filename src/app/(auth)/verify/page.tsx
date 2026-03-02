'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bot, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''

    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const supabase = createClient()

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError('Email manzili topilmadi')
            return
        }
        if (code.length !== 8) {
            setError('Kod 8 ta raqamdan iborat bo\'lishi kerak')
            return
        }

        setError('')
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'signup',
            })

            if (error) {
                setError(error.message.includes('expired') ? 'Kod eskirgan yoto xato' : 'Kod bekor qilindi yoki xato')
                return
            }

            setSuccess(true)
            toast.success('Pochta muvaffaqiyatli tasdiqlandi! 🎉')

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch {
            setError('Kutilmagan xatolik')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Tasdiqlandi!</h2>
                <p className="text-gray-400 mb-6">
                    Sizning hisobingiz muvaffaqiyatli tasdiqlandi. Tizimga kirilmoqda...
                </p>
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">Uz-Flow <span className="gradient-text">AI</span></span>
                </Link>
                <h1 className="text-2xl font-bold text-white">Pochtani tasdiqlang</h1>
                <p className="text-gray-400 mt-1">
                    Biz quyidagi manzilga 8-xonali kod yubordik:<br />
                    <strong className="text-white">{email}</strong>
                </p>
            </div>

            <div className="glass border border-white/10 rounded-2xl p-8">
                <form onSubmit={handleVerify} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">Tasdiqlash kodi / Код подтверждения</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                name="code"
                                required
                                maxLength={8}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-center tracking-[0.5em] text-white text-lg font-bold placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length !== 8}
                        className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Tasdiqlanmoqda...</>
                        ) : 'Tasdiqlash'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Kodni olmadingizmi?{' '}
                    <button onClick={() => toast.info("Email xabarlar spam qutisiga tushgan bo'lishi mumkin. Qayta urinib ko'rish uchun biroz kuting.")} className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Yana yuborish
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen dark mesh-bg flex items-center justify-center px-4 py-12">
            <Suspense fallback={<Loader2 className="w-8 h-8 text-purple-400 animate-spin" />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
