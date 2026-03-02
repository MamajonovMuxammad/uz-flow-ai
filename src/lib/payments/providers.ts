import crypto from 'crypto'

export interface PaymentResult {
    success: boolean
    paymentUrl?: string
    transactionId?: string
    error?: string
}

// ==========================================
// CLICK PAYMENT
// ==========================================
export async function createClickInvoice(params: {
    merchantId: string
    serviceId: string
    secretKey: string
    amount: number // in UZS
    orderId: string
    description: string
    returnUrl?: string
}): Promise<PaymentResult> {
    try {
        const { merchantId, serviceId, secretKey, amount, orderId, description, returnUrl } = params

        // Click uses amount in UZS (tiyin = amount * 100)
        const amountTiyin = amount * 100
        const signTime = Date.now()
        const signString = `${merchantId}${serviceId}${secretKey}${orderId}${amountTiyin}${signTime}`
        const sign = crypto.createHash('md5').update(signString).digest('hex')

        // Click payment URL format
        const paymentUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl || '')}&sign_time=${signTime}&sign_string=${sign}`

        return {
            success: true,
            paymentUrl,
            transactionId: `click_${orderId}_${signTime}`,
        }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export function verifyClickPayment(params: {
    secretKey: string
    serviceId: string
    clickTransId: string
    merchantTransId: string
    amount: string
    action: string
    signTime: string
    signString: string
}): boolean {
    const { secretKey, serviceId, clickTransId, merchantTransId, amount, action, signTime } = params
    const md5 = crypto.createHash('md5')
        .update(`${clickTransId}${serviceId}${secretKey}${merchantTransId}${amount}${action}${signTime}`)
        .digest('hex')
    return md5 === params.signString
}

// ==========================================
// PAYME PAYMENT  
// ==========================================
export async function createPaymeInvoice(params: {
    merchantId: string
    amount: number // in UZS
    orderId: string
    description: string
    returnUrl?: string
}): Promise<PaymentResult> {
    try {
        const { merchantId, amount, orderId, description, returnUrl } = params

        // Payme uses amount in tiyin (1 UZS = 100 tiyin)
        const amountTiyin = amount * 100

        const payload = {
            m: merchantId,
            ac: { order_id: orderId },
            a: amountTiyin,
            l: 'uz',
            ...(returnUrl && { c: returnUrl }),
        }

        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
        const paymentUrl = `https://checkout.paycom.uz/${encoded}`

        return {
            success: true,
            paymentUrl,
            transactionId: `payme_${orderId}_${Date.now()}`,
        }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export function verifyPaymeRequest(params: {
    merchantId: string
    secretKey: string
    authHeader: string
}): boolean {
    const { merchantId, secretKey, authHeader } = params
    const expected = Buffer.from(`${merchantId}:${secretKey}`).toString('base64')
    return authHeader === `Basic ${expected}`
}

// ==========================================
// PAYMENT TELEGRAM MESSAGE
// ==========================================
export function formatPaymentMessage(params: {
    providerName: string
    amount: number
    description: string
    paymentUrl: string
    language: 'uz' | 'ru'
}): string {
    const { providerName, amount, description, paymentUrl, language } = params
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(amount)

    if (language === 'ru') {
        return `💳 *Счёт на оплату*\n\n` +
            `📦 *Товар/Услуга:* ${description}\n` +
            `💰 *Сумма:* ${formattedAmount} сум\n` +
            `🏦 *Способ оплаты:* ${providerName}\n\n` +
            `👇 Нажмите кнопку ниже для оплаты:\n${paymentUrl}`
    }

    return `💳 *To'lov hisobi*\n\n` +
        `📦 *Mahsulot/Xizmat:* ${description}\n` +
        `💰 *Summa:* ${formattedAmount} so'm\n` +
        `🏦 *To'lov usuli:* ${providerName}\n\n` +
        `👇 To'lov uchun quyidagi tugmani bosing:\n${paymentUrl}`
}
