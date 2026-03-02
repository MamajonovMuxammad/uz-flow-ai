'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bot, Mail, Lock, Eye, EyeOff, Building2, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        businessName: '',
        phone: '+998 ',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const supabase = createClient()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === 'phone') {
            let cleaned = value.replace(/[^\d+]/g, '')
            if (!cleaned.startsWith('+998')) cleaned = '+998'
            const digits = cleaned.slice(4).replace(/\D/g, '').slice(0, 9)
            let formatted = '+998'
            if (digits.length > 0) formatted += ' ' + digits.slice(0, 2)
            if (digits.length > 2) formatted += ' ' + digits.slice(2, 5)
            if (digits.length > 5) formatted += '-' + digits.slice(5, 7)
            if (digits.length > 7) formatted += '-' + digits.slice(7, 9)
            setForm(f => ({ ...f, phone: formatted }))
            return
        }
        setForm(f => ({ ...f, [name]: value }))
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (form.password.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
            return
        }
        if (form.password !== form.confirmPassword) {
            setError('Parollar mos emas')
            return
        }
        if (!form.businessName.trim()) {
            setError('Biznes nomi kiritilishi shart')
            return
        }

        setLoading(true)
        try {
            const { error, data } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: { business_name: form.businessName, phone: form.phone, display_name: form.businessName },
                },
            })

            if (error) {
                if (error.message.includes('already registered')) {
                    setError('Bu email allaqachon ro\'yxatdan o\'tgan')
                } else {
                    setError(error.message)
                }
                return
            }

            // Successfully signed up, redirect to verification page
            toast.success('Ro\'yxatdan o\'tdingiz! Tasdiqlash kodini kiriting.')
            router.push(`/verify?email=${encodeURIComponent(form.email)}`)
        } catch {
            setError('Kutilmagan xatolik. Qaytadan urinib ko\'ring.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen dark mesh-bg flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Email jo'natildi!</h2>
                    <p className="text-gray-400 mb-6">
                        <strong className="text-white">{form.email}</strong> manziliga tasdiqlash havolasi yuborildi.
                        Pochta qutingizni tekshiring.
                    </p>
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                        Kirish sahifasiga qaytish →
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen dark mesh-bg flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Uz-Flow <span className="gradient-text">AI</span></span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Biznesingizni ulang</h1>
                    <p className="text-gray-400 mt-1">14 kun bepul, karta kerak emas</p>
                </div>

                <div className="glass border border-white/10 rounded-2xl p-8">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Business Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Biznes nomi</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="signup-business"
                                    type="text"
                                    name="businessName"
                                    required
                                    value={form.businessName}
                                    onChange={handleChange}
                                    placeholder="Mening Do'konim"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Telefon raqami</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+998 90 123-45-67"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="signup-email"
                                    type="email"
                                    name="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="siz@biznes.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Parol</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Kamida 6 belgi"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Parolni tasdiqlang</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="signup-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    required
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Parolni qaytaring"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-purple-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            id="signup-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Ro'yxatdan o'tilmoqda...</>
                            ) : 'Bepul Boshlash'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Allaqachon hisobingiz bormi?{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Kirish
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
