'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Bot, Users, BookOpen, Settings,
    LogOut, Zap, CreditCard, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

const navItemsKeys = [
    { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { href: '/bots', labelKey: 'bots', icon: Bot },
    { href: '/leads', labelKey: 'leads', icon: Users },
    { href: '/knowledge', labelKey: 'knowledge', icon: BookOpen },
    { href: '/settings', labelKey: 'settings', icon: Settings },
]

interface SidebarProps {
    profile: {
        business_name: string
        subscription_status: string
        subscription_plan?: string
        is_admin?: boolean
        avatar_url?: string
    } | null
}

export default function DashboardSidebar({ profile }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { t } = useLanguage()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        toast.success('Tizimdan chiqildi')
        router.push('/login')
        router.refresh()
    }

    const planColors: Record<string, string> = {
        free: 'text-gray-400 bg-gray-400/10',
        none: 'text-gray-400 bg-gray-400/10',
        starter: 'text-blue-400 bg-blue-400/10',
        business: 'text-purple-400 bg-purple-400/10',
        premium: 'text-yellow-400 bg-yellow-400/10',
    }

    const planLabels: Record<string, string> = {
        free: t('free'),
        none: t('none') || 'Cheklangan',
        starter: t('starter'),
        business: t('business'),
        premium: t('premium'),
    }

    const status = profile?.subscription_status || 'none'
    const planDisplayStatus = profile?.subscription_plan || status

    return (
        <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/5 flex flex-col z-40">
            {/* Logo */}
            <div className="p-5 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm leading-none">Uz-Flow AI</div>
                        <div className="text-xs text-gray-500 mt-0.5">Biznes Platformasi</div>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItemsKeys.map(({ href, labelKey, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                                isActive
                                    ? 'active bg-purple-500/15 text-white border-l-2 border-purple-500'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <Icon className={cn('w-4 h-4', isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300')} />
                            {t(labelKey)}
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto text-purple-400" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Plan Banner */}
            {(planDisplayStatus === 'free' || planDisplayStatus === 'none') && !(profile as any)?.is_admin && (
                <div className="mx-3 mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 text-xs font-semibold">Biznesga o'tish</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-2">Cheksiz xabar va ko'proq imkoniyat</p>
                    <Link href="/settings" className="block text-center bg-gradient-brand text-white text-xs py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Yangilash
                    </Link>
                </div>
            )}

            {/* Profile */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 py-1.5">
                    <Link href="/settings" className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors">
                        {(profile as any)?.avatar_url ? (
                            <img src={(profile as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            getInitials(profile?.business_name || 'UZ')
                        )}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href="/settings" className="block text-sm font-medium text-white truncate hover:text-purple-300 transition-colors">
                            {profile?.business_name || 'Biznes'}
                        </Link>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', (profile as any)?.is_admin ? 'text-red-400 bg-red-400/10' : planColors[planDisplayStatus] || planColors.none)}>
                            {(profile as any)?.is_admin ? 'Admin' : (planLabels[planDisplayStatus] || planLabels.none)}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Chiqish"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
