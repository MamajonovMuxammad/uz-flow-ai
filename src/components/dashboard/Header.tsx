'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Bell, Search, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

import { useLanguage } from '@/lib/i18n'

interface HeaderProps {
    profile: { business_name: string; subscription_status: string } | null
    user: SupabaseUser
}

export default function DashboardHeader({ profile, user }: HeaderProps) {
    const { lang, setLang, t } = useLanguage()
    const hour = new Date().getHours()

    // Custom greeting translation since it's dynamic
    const greetingText = lang === 'uz'
        ? (hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech')
        : (hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер')

    const toggleLang = () => setLang(lang === 'uz' ? 'ru' : 'uz')

    return (
        <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
                <h2 className="text-sm font-medium text-white">
                    {greetingText}, <span className="text-purple-300">{profile?.business_name || user.email?.split('@')[0]}</span> 👋
                </h2>
            </div>

            <div className="flex items-center gap-3">
                {/* Search placeholder */}
                <div
                    onClick={() => toast.info(t('search_soon'))}
                    className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 w-48 text-gray-500 text-sm cursor-pointer hover:border-white/15 transition-colors"
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>{t('search_placeholder')}</span>
                    <span className="ml-auto text-xs bg-white/5 px-1 rounded">⌘K</span>
                </div>

                {/* Language Switcher */}
                <button
                    onClick={toggleLang}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/15 transition-all text-xs font-bold uppercase"
                    title="Tilni o'zgartirish / Сменить язык"
                >
                    {lang}
                </button>

                {/* Notifications */}
                <button
                    onClick={() => toast.info(t('no_notifications'))}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/15 transition-all relative"
                >
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full"></span>
                </button>

                {/* Avatar */}
                <Link href="/settings" className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors">
                    {(profile as any)?.avatar_url ? (
                        <img src={(profile as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-4 h-4 text-white" />
                    )}
                </Link>
            </div>
        </header>
    )
}
