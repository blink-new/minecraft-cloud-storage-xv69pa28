import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserSettingsPage } from '../components/settings/UserSettingsPage'
import { supabase, FileItem } from '../lib/supabase'
import { calculateTotalUsage } from '../lib/plans'
import { useToast } from '../hooks/use-toast'

export function SettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [userPlanId, setUserPlanId] = useState('free')
  const [totalUsedStorage, setTotalUsedStorage] = useState(0)
  const [checkingPayment, setCheckingPayment] = useState(false)

  // Check for successful payment redirect
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId && user) {
      setCheckingPayment(true)
      // Wait a moment for webhook to process, then refresh subscription
      const checkSubscription = async () => {
        let attempts = 0
        const maxAttempts = 10
        
        const checkInterval = setInterval(async () => {
          attempts++
          
          const { data: subscriptionData, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (!error && subscriptionData && subscriptionData.plan_id !== 'free') {
            // Subscription updated!
            clearInterval(checkInterval)
            setUserPlanId(subscriptionData.plan_id)
            setCheckingPayment(false)
            toast({
              title: "Subscription Activated! ",
              description: `Welcome to the ${subscriptionData.plan_id} plan!`,
              variant: "default"
            })
            // Clean URL
            navigate('/settings', { replace: true })
          } else if (attempts >= maxAttempts) {
            // Timeout - webhook might be delayed
            clearInterval(checkInterval)
            setCheckingPayment(false)
            toast({
              title: "Payment Processing",
              description: "Your payment is being processed. Please refresh in a moment.",
              variant: "default"
            })
            navigate('/settings', { replace: true })
          }
        }, 2000) // Check every 2 seconds
      }
      
      checkSubscription()
    }
  }, [searchParams, user, navigate, toast])

  // Fetch user plan and total storage usage
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        // Fetch subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .rpc('get_user_subscription', { p_user_id: user.id })
        
        if (!subscriptionError && subscriptionData && subscriptionData.length > 0) {
          setUserPlanId(subscriptionData[0].plan_id)
        } else if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError)
        }

        // Fetch total storage
        const { data: allFiles, error: allFilesError } = await supabase
          .from('files')
          .select('size, type')
          .eq('user_id', user.id)

        if (!allFilesError && allFiles) {
          const totalUsage = calculateTotalUsage(allFiles as FileItem[])
          setTotalUsedStorage(totalUsage)
        } else if (allFilesError) {
          console.error('Error fetching total storage:', allFilesError)
        }
      }
      fetchUserData()
    }
  }, [user])

  const handleNavigateToPricing = () => {
    navigate('/pricing', { state: { from: '/settings' } })
  }

  const handleBackToDashboard = () => {
    navigate('/')
  }

  if (loading || checkingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
        <div className="text-center">
          <div className="minecraft-card w-24 h-24 flex items-center justify-center bg-primary animate-pulse mx-auto mb-4">
            <span className="font-minecraft text-2xl text-primary-foreground">⚡</span>
          </div>
          {checkingPayment && (
            <p className="font-minecraft text-sm text-primary">Activating your subscription...</p>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <UserSettingsPage
      currentPlanId={userPlanId}
      totalUsedStorage={totalUsedStorage}
      onNavigateToPricing={handleNavigateToPricing}
      onBackToDashboard={handleBackToDashboard}
    />
  )
}