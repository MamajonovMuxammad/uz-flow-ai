import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'

import { Providers } from '@/lib/Providers'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <Providers>
            <div className="dark min-h-screen flex" style={{ background: '#060610' }}>
                <DashboardSidebar profile={profile} />
                <div className="flex-1 flex flex-col min-h-screen ml-64">
                    <DashboardHeader profile={profile} user={user} />
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </Providers>
    )
}
