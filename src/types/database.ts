export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    business_name: string
                    business_type: string | null
                    phone: string | null
                    subscription_status: 'free' | 'basic' | 'pro' | 'enterprise'
                    subscription_expires_at: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    business_name?: string
                    business_type?: string | null
                    phone?: string | null
                    subscription_status?: 'free' | 'basic' | 'pro' | 'enterprise'
                    subscription_expires_at?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    business_name?: string
                    business_type?: string | null
                    phone?: string | null
                    subscription_status?: 'free' | 'basic' | 'pro' | 'enterprise'
                    subscription_expires_at?: string | null
                    avatar_url?: string | null
                    updated_at?: string
                }
            }
            bots: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    bot_token: string
                    bot_username: string | null
                    welcome_message: string
                    ai_prompt_context: string
                    language: 'uz' | 'ru' | 'auto'
                    is_active: boolean
                    webhook_url: string | null
                    openai_api_key: string | null
                    click_merchant_id: string | null
                    click_service_id: string | null
                    click_secret_key: string | null
                    payme_merchant_id: string | null
                    payme_secret_key: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Partial<Database['public']['Tables']['bots']['Row']> & {
                    owner_id: string
                    bot_token: string
                }
                Update: Partial<Database['public']['Tables']['bots']['Row']>
            }
            knowledge_base: {
                Row: {
                    id: string
                    bot_id: string
                    title: string
                    content_text: string
                    content_type: 'text' | 'pdf' | 'faq' | 'product'
                    embedding_vector: number[] | null
                    metadata: Json
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['knowledge_base']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['knowledge_base']['Row']>
            }
            leads: {
                Row: {
                    id: string
                    bot_id: string
                    telegram_id: number
                    telegram_username: string | null
                    first_name: string | null
                    last_name: string | null
                    customer_phone: string | null
                    chat_summary: string | null
                    last_message: string | null
                    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
                    language: string | null
                    total_messages: number
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'> & {
                    bot_id: string
                    telegram_id: number
                }
                Update: Partial<Database['public']['Tables']['leads']['Row']>
            }
            chat_messages: {
                Row: {
                    id: string
                    lead_id: string
                    bot_id: string
                    role: 'user' | 'assistant'
                    content: string
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['chat_messages']['Row']>
            }
            payments: {
                Row: {
                    id: string
                    bot_id: string
                    lead_id: string | null
                    provider: 'click' | 'payme'
                    amount: number
                    currency: string
                    description: string | null
                    status: 'pending' | 'paid' | 'cancelled' | 'failed'
                    external_id: string | null
                    payment_url: string | null
                    paid_at: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['payments']['Row']>
            }
        }
        Functions: {
            match_documents: {
                Args: {
                    query_embedding: number[]
                    match_threshold: number
                    match_count: number
                    p_bot_id: string
                }
                Returns: { id: string; content_text: string; similarity: number }[]
            }
        }
    }
}
