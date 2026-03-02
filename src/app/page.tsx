import Link from 'next/link'
import {
  Bot, Zap, Shield, BarChart3, MessageSquare, CreditCard,
  ArrowRight, Globe, CheckCircle, Star, Users, TrendingUp
} from 'lucide-react'

const features = [
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI Telegram Bot",
    desc: "GPT-4o asosidagi bot o'zbek va rus tillarini avtomatik taniydi va professional javob beradi."
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "UZ/RU Til Qo'riqchisi",
    desc: "Mijoz qaysi tilda yozsa, bot ham shu tilda javob beradi. Hech qanday sozlamalar kerak emas."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "RAG Bilim Bazasi",
    desc: "Mahsulotlaringiz, FAQ va narxlarni yuklab qo'ying. Bot hamma narsani biladi."
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Click & Payme To'lov",
    desc: "Telegram chatda to'g'ridan-to'g'ri Click yoki Payme orqali to'lov qabul qiling."
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Lead Boshqaruvi",
    desc: "Har bir suhbat avtomatik saqlanadi. Mijoz telefon raqamini bot o'zi so'raydi."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Ishonchli & Xavfsiz",
    desc: "Supabase Row Level Security. Har bir biznesning ma'lumotlari to'liq izolyatsiyalangan."
  },
]

const plans = [
  {
    name: "Boshlang'ich",
    price: "229 000",
    period: "/oy",
    features: ["1 ta bot", "10 000 ta xabar/oy", "Asosiy analitika", "Barcha integratsiyalar"],
    cta: "Bepul boshlash",
    highlighted: false,
  },
  {
    name: "Biznes",
    price: "349 000",
    period: "/oy",
    features: ["2 ta bot", "50 000 ta xabar/oy", "Click & Payme to'lov", "RAG bilim bazasi", "Ustuvor yordam"],
    cta: "Biznesni tanlash",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "449 000",
    period: "/oy",
    features: ["4 ta bot", "Cheksiz xabarlar", "Eksklyuziv funksiyalar", "Shaxsiy menejer", "SLA kafolati"],
    cta: "Premiumga o'tish",
    highlighted: false,
  },
]

const stats = [
  { value: "500+", label: "Faol Biznes" },
  { value: "2M+", label: "Yuborilgan Xabar" },
  { value: "98%", label: "Javob Aniqligi" },
  { value: "3x", label: "Savdo O'sishi" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen dark text-white overflow-x-hidden">
      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Uz-Flow <span className="gradient-text">AI</span></span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Imkoniyatlar</a>
              <a href="#pricing" className="hover:text-white transition-colors">Narxlar</a>
              <a href="#stats" className="hover:text-white transition-colors">Natijalar</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Kirish
              </Link>
              <Link href="/signup" className="bg-gradient-brand text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                Bepul Boshlash
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-purple-500/30 text-purple-300 text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            O'zbekistondagi 500+ biznes ishlatmoqda
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Telegram savdongizni{' '}
            <span className="gradient-text">AI-ga</span>{' '}
            ishoning
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            O'zbek va rus tillarida 24/7 javob beradigan, Click/Payme orqali to'lov qabul qiladigan
            va lidlarni avtomatik boshqaradigan AI agent yarating.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-brand text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity glow-purple"
            >
              Hoziroq Boshlash
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 glass border border-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-purple-500/50 transition-colors"
            >
              Ko'proq Bilish
            </a>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="glass border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto glow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500 ml-2">Telegram Bot Preview</span>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-gray-300">
                    Assalomu alaykum! Sizning mahsulotlar narxi qancha?
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl rounded-tr-none px-4 py-2 text-sm text-gray-300 max-w-xs">
                    Assalomu alaykum! Bizning mahsulotlar narxlari: 📦 Asosiy to'plam — 150 000 so'm, Premium to'plam — 280 000 so'm. Qaysi biri qiziqarli?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-gray-300">
                    Premium to'plam kerak
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl rounded-tr-none px-4 py-2 text-sm text-gray-300 max-w-xs">
                    Ajoyib tanlov! 💳 <strong>Payme</strong> orqali to'lash uchun: [To'lov havolasi]<br />
                    Telefon raqamingizni qoldirsangiz, tez yetkazib beramiz 📞
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section id="stats" className="py-16 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Hamma narsa bir joyda</h2>
            <p className="text-gray-400 text-lg">O'zbekiston bozori uchun maxsus ishlab chiqilgan</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass border border-white/5 rounded-2xl p-6 card-hover">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Narx Rejalari</h2>
            <p className="text-gray-400 text-lg">O'zbek so'mida, biznesga mos narxlar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 ${plan.highlighted
                  ? 'bg-gradient-brand glow-purple border-0'
                  : 'glass border border-white/5'}`}
              >
                {plan.highlighted && (
                  <div className="flex items-center gap-1 text-yellow-300 text-xs font-medium mb-3">
                    <Star className="w-3 h-3 fill-current" />
                    Eng Mashhur
                  </div>
                )}
                <div className="text-lg font-semibold mb-1">{plan.name}</div>
                <div className="text-3xl font-bold mb-1">
                  {plan.price} <span className="text-sm font-normal opacity-70">so'm{plan.period}</span>
                </div>
                <div className="border-t border-white/10 my-4"></div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm opacity-90">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 opacity-80" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 rounded-xl font-medium text-sm transition-all ${plan.highlighted
                    ? 'bg-white text-purple-700 hover:bg-gray-100'
                    : 'glass border border-white/10 hover:border-purple-500/50'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center glass border border-purple-500/20 rounded-3xl p-12 glow-sm">
          <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Bugun boshlang!</h2>
          <p className="text-gray-400 mb-8">14 kun bepul sinab ko'ring, karta kerak emas.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-gradient-brand text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Hoziroq Ro'yxatdan O'tish <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Uz-Flow AI</span>
            <span className="text-gray-500 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-sm">O'zbekiston uchun, O'zbekistonda yaratilgan 🇺🇿</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
