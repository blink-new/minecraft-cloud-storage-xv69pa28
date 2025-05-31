import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { 
  getPlanById, 
  formatBytes, 
  calculateUsagePercentage 
} from '../../lib/plans'
import { getUserSubscription, SubscriptionData } from '../../lib/stripe'
import { ArrowLeftIcon, GemIcon, ShieldCheckIcon, BarChartIcon, UserCircleIcon, CalendarIcon, CreditCardIcon } from 'lucide-react'

interface UserSettingsPageProps {
  user: any
  currentPlanId: string
  totalUsedStorage: number
  onNavigateToPricing: () => void
  onBackToDashboard: () => void
}

export function UserSettingsPage({ 
  user,
  currentPlanId,
  totalUsedStorage,
  onNavigateToPricing,
  onBackToDashboard,
}: UserSettingsPageProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
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
  }, [user?.id])

  const currentPlan = getPlanById(subscription?.plan_id || currentPlanId || 'free')
  const usagePercentage = calculateUsagePercentage(totalUsedStorage, currentPlan.storage)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getBillingStatus = () => {
    if (!subscription || subscription.plan_id === 'free') {
      return { text: 'Free Plan', color: 'bg-gray-500' }
    }

    switch (subscription.status) {
      case 'active':
        return { text: 'Active', color: 'bg-green-500' }
      case 'past_due':
        return { text: 'Past Due', color: 'bg-yellow-500' }
      case 'canceled':
        return { text: 'Canceled', color: 'bg-red-500' }
      default:
        return { text: subscription.status, color: 'bg-gray-500' }
    }
  }

  const billingStatus = getBillingStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
      <header className="bg-card/90 backdrop-blur-sm border-b-4 border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="font-minecraft text-xs"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Files
              </Button>
              <div className="flex items-center space-x-4">
                <div className="minecraft-card w-12 h-12 bg-primary flex items-center justify-center">
                  <span className="font-minecraft text-lg text-primary-foreground">⚙️</span>
                </div>
                <h1 className="font-minecraft text-xl text-primary">
                  Account Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <Card className="minecraft-card bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-minecraft text-lg flex items-center">
                <UserCircleIcon className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-minecraft text-xs text-muted-foreground">Email</label>
                <div className="font-minecraft text-sm">{user?.email}</div>
              </div>
              
              <div>
                <label className="font-minecraft text-xs text-muted-foreground">User ID</label>
                <div className="font-minecraft text-xs text-gray-500 truncate">{user?.id}</div>
              </div>

              <div>
                <label className="font-minecraft text-xs text-muted-foreground">Member Since</label>
                <div className="font-minecraft text-sm">
                  {formatDate(user?.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card className="minecraft-card bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-minecraft text-lg flex items-center">
                <GemIcon className="w-5 h-5 mr-2" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{currentPlan.icon}</span>
                  <div>
                    <h3 className="font-minecraft text-lg font-bold">{currentPlan.name}</h3>
                    <p className="font-minecraft text-xs text-muted-foreground">{currentPlan.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="font-minecraft text-xs">
                  {currentPlan.displayName}
                </Badge>
              </div>

              <div>
                <div className="flex justify-between font-minecraft text-xs mb-2">
                  <span>Storage Used</span>
                  <span>
                    {formatBytes(totalUsedStorage)} of {currentPlan.storageDisplay}
                  </span>
                </div>
                <Progress value={usagePercentage} className="minecraft-progress" />
                <p className="font-minecraft text-xs text-muted-foreground mt-1">
                  {usagePercentage.toFixed(1)}% used
                </p>
              </div>

              <div>
                <h4 className="font-minecraft text-sm font-semibold mb-2">Plan Features:</h4>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center font-minecraft text-xs">
                      <ShieldCheckIcon className="w-3 h-3 mr-2 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />

              {subscription && subscription.plan_id !== 'free' && (
                <>
                  <div>
                    <h4 className="font-minecraft text-sm font-semibold mb-2">Billing Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-minecraft text-xs">Billing Cycle:</span>
                        <span className="font-minecraft text-xs text-muted-foreground capitalize">
                          {subscription.billing_cycle}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-minecraft text-xs">Status:</span>
                        <Badge className={`${billingStatus.color} text-white font-minecraft text-xs px-2 py-1`}>
                          {billingStatus.text}
                        </Badge>
                      </div>
                      {subscription.current_period_end && (
                        <div className="flex items-center justify-between">
                          <span className="font-minecraft text-xs">Next Billing:</span>
                          <span className="font-minecraft text-xs text-muted-foreground">
                            {formatDate(subscription.current_period_end)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <Button 
                onClick={onNavigateToPricing}
                className="w-full block-button bg-primary hover:bg-primary/90 font-minecraft text-sm"
              >
                <BarChartIcon className="w-4 h-4 mr-2" />
                View Plans & Upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}