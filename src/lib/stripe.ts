import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Price ID mapping for each plan and billing cycle
export const STRIPE_PRICE_IDS = {
  plus: {
    monthly: 'price_1RUlFvAuVIJ8D9WKEChgYOLK',
    annual: 'price_1RUlFzAuVIJ8D9WKkmt4UMkU'
  },
  pro: {
    monthly: 'price_1RUlG4AuVIJ8D9WKhhTm9WyK',
    annual: 'price_1RUlG7AuVIJ8D9WKpDzpM0s8'
  },
  max: {
    monthly: 'price_1RUlGBAuVIJ8D9WKMlHFnMrl',
    annual: 'price_1RUlGFAuVIJ8D9WKJpQceCgQ'
  }
}

export interface SubscriptionData {
  id?: number
  user_id: string
  plan_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  status: string
  billing_cycle: string
  current_period_start?: string
  current_period_end?: string
  created_at?: string
  updated_at?: string
}

export async function createCheckoutSession(planId: string, billing: 'monthly' | 'annual', userId: string) {
  try {
    // Get price ID based on plan and billing cycle
    const priceId = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS]?.[billing]
    
    if (!priceId) {
      throw new Error(`Invalid plan or billing cycle: ${planId} ${billing}`)
    }

    // Call our Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        userId,
        successUrl: `${window.location.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`
      }
    })

    if (error) {
      console.error('Supabase function error:', error)
      throw new Error('Failed to create checkout session')
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned')
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function getUserSubscription(userId: string): Promise<SubscriptionData | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}

export async function createOrUpdateSubscription(subscriptionData: Partial<SubscriptionData>) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

export function getStripeDashboardUrl(): string {
  return 'https://dashboard.stripe.com/test/customers' // Test mode URL
}