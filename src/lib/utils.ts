import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'UZS'): string {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: currency === 'UZS' ? 'USD' : currency, // Intl doesn't support UZS natively
        minimumFractionDigits: 0,
    }).format(amount).replace('$', '') + (currency === 'UZS' ? ' so\'m' : ` ${currency}`)
}

export function formatPhone(phone: string): string {
    // Format as +998 XX XXX-XX-XX
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('998') && cleaned.length === 12) {
        return `+998 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`
    }
    return phone
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function timeAgo(date: string | Date): string {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'Hozir'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} daqiqa oldin`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} soat oldin`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} kun oldin`
    return then.toLocaleDateString('uz-UZ')
}

export function generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}
