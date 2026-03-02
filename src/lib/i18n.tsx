'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'uz' | 'ru'

interface LanguageContextType {
    lang: Language
    setLang: (l: Language) => void
    t: (key: string) => string
}

const DICTIONARY: Record<Language, Record<string, string>> = {
    uz: {
        'dashboard': 'Bosh sahifa',
        'bots': 'Botlar',
        'leads': 'Lidlar',
        'knowledge': 'Ta\'lim',
        'settings': 'Sozlamalar',
        'search_placeholder': 'Qidirish...',
        'search_soon': 'Qidiruv funksiyasi tez orada ishga tushadi',
        'notifications': 'Xabarnomalar',
        'no_notifications': 'Yangi xabarnomalar yo\'q',
        'logout': 'Chiqish',
        'update_plan': 'Yangilash',
        'free': 'Bepul',
        'starter': 'Boshlang\'ich',
        'business': 'Biznes',
        'premium': 'Premium',
        'admin': 'Admin',
        'new_bot': 'Yangi bot',
        'no_bot': 'Hali bot yo\'q',
        'create_first_bot': 'Birinchi botingizni yarating',
        'active': 'Faol',
        'inactive': 'Yopiq',
        'settings_page_title': 'Sozlamalar',
        'profile': 'Profil',
        'billing': 'Obuna',
        'security': 'Xavfsizlik',
        'leads_title': 'Mijozlar',
        'leads_desc': 'Telegram bot orqali kelgan barcha mijozlar va yozilishlar',
        'all_bots': 'Barcha botlar',
        'bookings_tab': 'Yozilishlar',
        'leads_tab': 'Lidlar',
        'status_pending': 'Ochiq',
        'status_confirmed': 'Tasdiqlandi',
        'status_cancelled': 'Bekor qilindi',
        'status_completed': 'Bajarildi',
        'table_service': 'Xizmat turi',
        'table_date_time': 'Sana va Vaqt',
        'table_customer': 'Mijoz',
        'table_status': 'Status',
        'table_bot': 'Bot',
        'table_name': 'Ism',
        'table_phone': 'Telefon raqami',
        'table_last_msg': 'Oxirgi xabar',
        'table_time': 'Vaqti',
        'no_records': 'Ma\'lumot topilmadi',
        'cancel': 'Bekor qilish',
        'confirm': 'Tasdiqlash',
        'complete': 'Bajarildi',
        'loading': 'Yuklanmoqda...'
    },
    ru: {
        'dashboard': 'Главная',
        'bots': 'Боты',
        'leads': 'Лиды',
        'knowledge': 'Знания',
        'settings': 'Настройки',
        'search_placeholder': 'Поиск...',
        'search_soon': 'Функция поиска скоро появится',
        'notifications': 'Уведомления',
        'no_notifications': 'Новых уведомлений нет',
        'logout': 'Выйти',
        'update_plan': 'Обновить',
        'free': 'Бесплатно',
        'starter': 'Стартовый',
        'business': 'Бизнес',
        'premium': 'Премиум',
        'admin': 'Админ',
        'new_bot': 'Новый бот',
        'no_bot': 'Пока нет ботов',
        'create_first_bot': 'Создайте своего первого бота',
        'active': 'Активен',
        'inactive': 'Остановлен',
        'settings_page_title': 'Настройки',
        'profile': 'Профиль',
        'billing': 'Подписка',
        'security': 'Безопасность',
        'leads_title': 'Клиенты',
        'leads_desc': 'Все клиенты и записи с ваших Telegram ботов',
        'all_bots': 'Все боты',
        'bookings_tab': 'Записи',
        'leads_tab': 'Лиды',
        'status_pending': 'Ожидает',
        'status_confirmed': 'Подтвержден',
        'status_cancelled': 'Отменен',
        'status_completed': 'Выполнен',
        'table_service': 'Услуга',
        'table_date_time': 'Дата и Время',
        'table_customer': 'Клиент',
        'table_status': 'Статус',
        'table_bot': 'Бот',
        'table_name': 'Имя',
        'table_phone': 'Телефон',
        'table_last_msg': 'Последнее сообщение',
        'table_time': 'Время',
        'no_records': 'Записей не найдено',
        'cancel': 'Отменить',
        'confirm': 'Подтвердить',
        'complete': 'Выполнен',
        'loading': 'Загрузка...'
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('uz')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedLang = localStorage.getItem('app_lang') as Language
        if (savedLang === 'uz' || savedLang === 'ru') {
            setLang(savedLang)
        }
        setMounted(true)
    }, [])

    const handleSetLang = (newLang: Language) => {
        setLang(newLang)
        localStorage.setItem('app_lang', newLang)
    }

    const t = (key: string) => {
        return DICTIONARY[lang][key] || key
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) throw new Error('useLanguage must be used within LanguageProvider')
    return context
}
