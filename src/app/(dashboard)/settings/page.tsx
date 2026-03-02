'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, Phone, Save, Loader2, Shield, CreditCard, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

const PLANS = {
    uz: [
        { id: 'starter', name: 'Boshlang\'ich', price: '229 000', bots: 1, features: ['1 ta bot', '10 000 xabar/oy', 'Barcha integratsiyalar'] },
        { id: 'business', name: 'Biznes', price: '349 000', bots: 2, features: ['2 ta bot', '50 000 xabar/oy', 'Click/Payme to\'lov', 'Ustuvor yordam'] },
        { id: 'premium', name: 'Premium', price: '449 000', bots: 4, features: ['4 ta bot', 'Cheksiz xabarlar', 'Eksklyuziv funksiyalar', 'Shaxsiy menejer'] }
    ],
    ru: [
        { id: 'starter', name: 'Стартовый', price: '229 000', bots: 1, features: ['1 бот', '10 000 сообщений/мес', 'Все интеграции'] },
        { id: 'business', name: 'Бизнес', price: '349 000', bots: 2, features: ['2 бота', '50 000 сообщений/мес', 'Click/Payme оплата', 'Приоритетная поддержка'] },
        { id: 'premium', name: 'Премиум', price: '449 000', bots: 4, features: ['4 бота', 'Безлимитные сообщения', 'Эксклюзивные функции', 'Личный менеджер'] }
    ]
}

export default function SettingsPage() {
    const supabase = createClient()
    const { t, lang } = useLanguage()
    const [profile, setProfile] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    useEffect(() => { loadProfile() }, [])

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
    }

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase.from('profiles').update({
            business_name: profile.business_name,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
            business_type: profile.business_type,
        }).eq('id', profile.id)
        if (error) toast.error(lang === 'uz' ? 'Saqlashda xatolik' : 'Ошибка при сохранении')
        else {
            toast.success(lang === 'uz' ? 'Profil saqlandi!' : 'Профиль сохранен!')
            window.location.reload()
        }
        setSaving(false)
    }

    const tabs = [
        { id: 'profile', label: t('profile'), icon: User },
        { id: 'billing', label: t('billing'), icon: CreditCard },
        { id: 'security', label: t('security') || 'Xavfsizlik', icon: Shield },
    ]

    if (!profile) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    )

    const currentPlans = lang === 'uz' ? PLANS.uz : PLANS.ru
    const isSubscribed = profile.subscription_plan && profile.subscription_plan !== 'none'
    const planName = currentPlans.find(p => p.id === profile.subscription_plan)?.name || (lang === 'uz' ? 'Bepul (Cheklangan)' : 'Бесплатно (Ограничено)')

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {/* Header section Apple-style */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 flex items-center gap-3">
                        {t('settings_page_title')}
                        {profile.is_admin && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">Admin</span>}
                        {isSubscribed && !profile.is_admin && <span className="text-xs bg-gradient-brand text-white border border-purple-500/30 px-3 py-1 rounded-full capitalize font-bold shadow-sm">Premium</span>}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Hisob va obuna sozlamalari / Настройки аккаунта</p>
                </div>
            </div>

            {/* Apple-style Segmented Control (Tabs) */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit backdrop-blur-sm shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === tab.id ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-sm backdrop-blur-md">
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2 pb-4 border-b border-white/5">
                        <Building2 className="w-5 h-5 text-purple-400" />
                        {lang === 'uz' ? 'Biznes Profil' : 'Бизнес Профиль'}
                    </h3>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Avatar URL havolasi' : 'Ссылка на аватар (URL)'}</label>
                            <input type="url" value={profile.avatar_url || ''}
                                onChange={e => setProfile((p: any) => ({ ...p, avatar_url: e.target.value }))}
                                placeholder="https://.../rasm.jpg"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-purple-500/50 transition-all font-mono" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Ism (Biznes nomi)' : 'Имя (Название бизнеса)'}</label>
                        <input type="text" value={profile.business_name || ''}
                            onChange={e => setProfile((p: any) => ({ ...p, business_name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">{lang === 'uz' ? 'Biznes turi' : 'Сфера деятельности'}</label>
                        <select value={profile.business_type || 'general'}
                            onChange={e => setProfile((p: any) => ({ ...p, business_type: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 transition-all">
                            <option className="bg-gray-900" value="general">{lang === 'uz' ? 'Umumiy' : 'Универсальный'}</option>
                            <option className="bg-gray-900" value="retail">{lang === 'uz' ? 'Do\'kon / Savdo' : 'Магазин / Ритейл'}</option>
                            <option className="bg-gray-900" value="food">{lang === 'uz' ? 'Restoran / Oziq-Ovqat' : 'Ресторан / Еда'}</option>
                            <option className="bg-gray-900" value="services">{lang === 'uz' ? 'Xizmatlar' : 'Услуги (Сфера услуг)'}</option>
                            <option className="bg-gray-900" value="education">{lang === 'uz' ? 'Ta\'lim' : 'Образование'}</option>
                            <option className="bg-gray-900" value="healthcare">{lang === 'uz' ? 'Sog\'liqni Saqlash' : 'Здравоохранение'}</option>
                            <option className="bg-gray-900" value="real_estate">{lang === 'uz' ? 'Ko\'chmas Mulk' : 'Недвижимость'}</option>
                            <option className="bg-gray-900" value="tech">{lang === 'uz' ? 'IT / Texnologiya' : 'IT / Технологии'}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">{lang === 'uz' ? 'Telefon raqami' : 'Номер телефона'}</label>
                        <div className="relative shadow-sm rounded-xl">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input type="tel" value={profile.phone || '+998 '}
                                onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                                placeholder="+998 90 123-45-67"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-purple-500/50 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" />
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 bg-gradient-brand text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'uz' ? 'Saqlanmoqda...' : 'Сохранение...'}</> : <><Save className="w-4 h-4" /> {lang === 'uz' ? 'Saqlash' : 'Сохранить'}</>}
                    </button>
                </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-sm backdrop-blur-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-white tracking-tight">{lang === 'uz' ? 'Joriy Reja' : 'Текущий тариф'}</h3>
                                <p className="text-sm text-gray-400 mt-0.5">{lang === 'uz' ? 'Sizning obunangiz haqida ma\'lumot' : 'Информация о вашей подписке'}</p>
                            </div>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                profile.is_admin ? "bg-red-500/20 text-red-400 border border-red-500/30" : (isSubscribed ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30")
                            )}>
                                {profile.is_admin ? "Admin" : planName}
                            </span>
                        </div>

                        {isSubscribed && !profile.is_admin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">{lang === 'uz' ? 'Xarid qilingan sana' : 'Дата покупки'}</p>
                                    <p className="text-sm font-semibold text-white">{profile.subscription_start ? new Date(profile.subscription_start).toLocaleString('uz-UZ') : '—'}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">{lang === 'uz' ? 'Tugash sanasi' : 'Дата окончания'}</p>
                                    <p className="text-sm font-semibold text-white">{profile.subscription_end ? new Date(profile.subscription_end).toLocaleString('uz-UZ') : '—'}</p>
                                </div>
                            </div>
                        )}
                        {profile.is_admin && (
                            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                                <p className="text-sm text-red-400 font-medium">
                                    {lang === 'uz' ? "Bu hisob ma'muri (Admin). Barcha funksiyalar va cheksiz botlar ochiq." : "Это аккаунт администратора. Доступны все функции и неограниченное количество ботов."}
                                </p>
                            </div>
                        )}
                    </div>

                    {!profile.is_admin && (
                        <>
                            <h3 className="text-xl font-semibold text-white mt-8 mb-6">{lang === 'uz' ? 'Ta\'riflar' : 'Тарифы'}</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentPlans.map(plan => (
                                    <div key={plan.id} className={cn(
                                        'bg-white/5 border rounded-3xl p-6 transition-all hover:-translate-y-1 shadow-sm backdrop-blur-md',
                                        profile.subscription_plan === plan.id ? 'border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-transparent' : 'border-white/10 hover:border-white/20'
                                    )}>
                                        <div className="mb-6">
                                            <h4 className="font-bold text-white text-xl mb-2">{plan.name}</h4>
                                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{plan.price}</span>
                                            <span className="text-sm font-medium text-gray-500 ml-1">{lang === 'uz' ? "so'm/oy" : "сум/мес"}</span>
                                        </div>

                                        <div className="mb-6">
                                            {profile.subscription_plan === plan.id ? (
                                                <span className="flex items-center justify-center gap-2 bg-green-500/20 text-green-400 w-full py-2.5 rounded-xl text-sm font-semibold border border-green-500/30">
                                                    <Check className="w-5 h-5" /> {lang === 'uz' ? 'Faol reja' : 'Текущий'}
                                                </span>
                                            ) : (
                                                <button onClick={() => toast.info(lang === 'uz' ? 'To\'lov tizimi tez kunda ishga tushadi' : 'Система оплаты скоро заработает')} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors">
                                                    {lang === 'uz' ? 'Sotib Olish' : 'Купить'}
                                                </button>
                                            )}
                                        </div>
                                        <ul className="space-y-2">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-sm backdrop-blur-md">
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2 pb-4 border-b border-white/5">
                        <Shield className="w-5 h-5 text-green-400" />
                        {lang === 'uz' ? 'Xavfsizlik' : 'Безопасность'}
                    </h3>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-sm text-green-300 font-medium">
                        ✓ {lang === 'uz' ? 'Supabase Row Level Security yoqilgan — ma\'lumotlaringiz himoyalangan' : 'Безопасность Supabase RLS включена — ваши данные надежно защищены'}
                    </div>
                    <div className="space-y-4 text-sm text-gray-400 bg-white/5 p-6 rounded-2xl border border-white/10">
                        <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {lang === 'uz' ? 'Barcha parollar bcrypt bilan shifrlangan' : 'Все пароли зашифрованы с помощью bcrypt'}</p>
                        <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {lang === 'uz' ? 'Bot tokenlar server-side da xavfsiz saqlanadi' : 'Токены ботов хранятся безопасно на стороне сервера'}</p>
                        <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {lang === 'uz' ? 'API kalitlar faqat sizga ko\'rinadi' : 'API ключи доступны только вам'}</p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={async () => {
                                await supabase.auth.resetPasswordForEmail(profile?.email || '')
                                toast.success(lang === 'uz' ? 'Parol o\'zgartirish havolasi emailga yuborildi' : 'Ссылка для сброса пароля отправлена на почту')
                            }}
                            className="flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors w-full sm:w-auto">
                            {lang === 'uz' ? 'Parolni O\'zgartirish' : 'Сменить Пароль'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
