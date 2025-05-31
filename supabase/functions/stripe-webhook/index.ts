import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "npm:stripe"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured in Supabase function environment.')
      return new Response('Webhook secret not configured.', { status: 500 })
    }

    if (!signature) {
      console.error('Stripe-Signature header missing from request.')
      return new Response('Stripe-Signature header missing.', { status: 400 })
    }

    const body = await req.text()
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        if (!userId || !subscriptionId) break
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const price = await stripe.prices.retrieve(priceId)
        const planId = price.metadata?.plan_id
        const billing = price.metadata?.billing
        // Upsert by user_id
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            billing_cycle: billing,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
        if (error) {
          console.error('Error upserting subscription:', error)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const price = await stripe.prices.retrieve(priceId)
        const planId = price.metadata?.plan_id
        const billing = price.metadata?.billing
        // Find user by stripe_customer_id
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle()
        if (!userSub) break
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            status: subscription.status,
            billing_cycle: billing,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userSub.user_id)
        if (error) {
          console.error('Error updating subscription:', error)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        // Find user by stripe_customer_id
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle()
        if (!userSub) break
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userSub.user_id)
        if (error) {
          console.error('Error canceling subscription:', error)
        }
        break
      }
      default:
        break
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('Webhook handler failed:', e.message)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', details: e.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})