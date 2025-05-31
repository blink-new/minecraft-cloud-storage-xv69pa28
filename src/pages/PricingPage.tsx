import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PricingPage as PricingComponent } from '../components/pricing/PricingPage'
import { getUserSubscription, SubscriptionData } from '../lib/stripe'
import { useToast } from '../hooks/use-toast'

export function PricingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const subData = await getUserSubscription(user.id)
        setSubscription(subData)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const handleBack = () => {
    const from = location.state?.from
    if (from) {
      navigate(from)
    } else {
      navigate('/')
    }
  }

  const handleSelectPlan = (planId: string, billing: 'monthly' | 'annual') => {
    // For free plan downgrades, we might need special handling
    if (planId === 'free') {
      toast({
        title: "Plan Change",
        description: "Please contact support to downgrade to the free plan.",
        variant: "default"
      })
      return
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-minecraft text-primary">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  return (
    <PricingComponent
      currentPlan={subscription?.plan_id || 'free'}
      userId={user?.id}
      onSelectPlan={handleSelectPlan}
      onBack={handleBack}
    />
  )
}