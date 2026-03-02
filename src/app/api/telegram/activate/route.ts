import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { botToken, webhookUrl } = await request.json()

        if (!botToken || !webhookUrl) {
            return NextResponse.json({ ok: false, description: 'Missing botToken or webhookUrl' }, { status: 400 })
        }

        // Set webhook on Telegram servers
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ['message', 'callback_query'],
                drop_pending_updates: true,
            }),
        })

        const result = await response.json()

        if (result.ok) {
            // Also get bot info to update username
            const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
            const info = await infoRes.json()
            return NextResponse.json({ ok: true, botUsername: info.result?.username })
        }

        return NextResponse.json({ ok: false, description: result.description })
    } catch (error) {
        return NextResponse.json({ ok: false, description: String(error) }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { botToken } = await request.json()
        const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
            method: 'POST',
        })
        const result = await response.json()
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
