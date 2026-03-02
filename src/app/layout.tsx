import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Uz-Flow AI — AI Biznes Avtomatlashtirish Platformasi',
  description: 'Telegram savdo, mijozlarga xizmat va to\'lovlarni (Click/Payme) AI agentlari yordamida avtomatlashtiring. O\'zbekiston biznes ekotizimi.',
  keywords: 'AI bot, Telegram bot, Click payment, Payme, Uzbekistan, biznes avtomatlashtirish, CRM',
  authors: [{ name: 'Uz-Flow AI' }],
  openGraph: {
    title: 'Uz-Flow AI',
    description: 'O\'zbekiston uchun AI-powered biznes avtomatlashtirish platformasi',
    siteName: 'Uz-Flow AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${inter.className} mesh-bg min-h-screen`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(224 71.4% 6%)',
              border: '1px solid hsl(215 27.9% 16.9%)',
              color: 'hsl(210 20% 98%)',
            },
          }}
          richColors
        />
      </body>
    </html>
  )
}
