import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { STORAGE_PLANS, StoragePlan } from '../../lib/plans'
import { createCheckoutSession } from '../../lib/stripe'
import { CheckIcon, CrownIcon, ZapIcon, ArrowLeftIcon, LoaderIcon } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface PricingPageProps {
  currentPlan?: string
  userId?: string
  onSelectPlan?: (planId: string, billing: 'monthly' | 'annual') => void
  onBack?: () => void
}

export function PricingPage({ currentPlan = 'free', userId, onSelectPlan, onBack }: PricingPageProps) {
  const [annualBilling, setAnnualBilling] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { toast } = useToast()

  const getRarityGradient = (rarity: StoragePlan['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
      case 'rare':
        return 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/20 dark:to-indigo-900/20'
      case 'epic':
        return 'bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/20 dark:to-pink-900/20'
      case 'legendary':
        return 'bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/20 dark:to-orange-900/20'
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
    }
  }

  const getRarityBorder = (rarity: StoragePlan['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 dark:border-gray-600'
      case 'rare':
        return 'border-blue-400 dark:border-blue-600'
      case 'epic':
        return 'border-purple-400 dark:border-purple-600'
      case 'legendary':
        return 'border-amber-400 dark:border-amber-600 shadow-amber-200/50 dark:shadow-amber-900/50'
      default:
        return 'border-gray-300 dark:border-gray-600'
    }
  }

  const calculateSavings = (plan: StoragePlan) => {
    const monthlyCost = plan.price.monthly * 12
    const savings = monthlyCost - plan.price.annual
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { amount: savings, percentage }
  }

  const handleSelectPlan = async (planId: string, billing: 'monthly' | 'annual') => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive"
      })
      return
    }

    if (planId === 'free') {
      // Handle free plan selection
      if (onSelectPlan) {
        onSelectPlan(planId, billing)
      }
      return
    }

    try {
      setLoadingPlan(planId)
      
      // Create Stripe checkout session
      await createCheckoutSession(planId, billing, userId)
      
      // The user will be redirected to Stripe, so we don't need to do anything else here
    } catch (error) {
      console.error('Error starting checkout:', error)
      toast({
        title: "Payment Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b-4 border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="font-minecraft text-xs"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex items-center space-x-4">
                <div className="minecraft-card w-12 h-12 bg-primary flex items-center justify-center">
                  <span className="font-minecraft text-lg text-primary-foreground">📦</span>
                </div>
                <h1 className="font-minecraft text-xl text-primary">
                  Choose Your Vault
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Billing Toggle */}
        <div className="text-center mb-12">
          <h2 className="font-minecraft text-3xl text-primary mb-4">
            Upgrade Your Storage Kingdom
          </h2>
          <p className="text-muted-foreground font-minecraft text-sm mb-8">
            Choose the perfect vault for your digital treasures
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className="font-minecraft text-sm">
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={annualBilling}
              onCheckedChange={setAnnualBilling}
              className="minecraft-switch"
            />
            <Label htmlFor="billing-toggle" className="font-minecraft text-sm">
              Annual
            </Label>
            <Badge variant="secondary" className="font-minecraft text-xs bg-green-500/20 text-green-700">
              <ZapIcon className="w-3 h-3 mr-1" />
              Save 17%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STORAGE_PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan
            const savings = calculateSavings(plan)
            const price = annualBilling ? plan.price.annual / 12 : plan.price.monthly
            const billingCycle = annualBilling ? 'annual' : 'monthly'

            return (
              <Card
                key={plan.id}
                className={`
                  relative minecraft-card transition-all duration-300 hover:scale-105
                  ${getRarityGradient(plan.rarity)}
                  ${getRarityBorder(plan.rarity)}
                  ${isCurrentPlan ? 'ring-2 ring-primary' : ''}
                  ${plan.rarity === 'legendary' ? 'shadow-xl' : 'shadow-lg'}
                `}
              >
                {plan.rarity === 'epic' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white font-minecraft text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {plan.rarity === 'legendary' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-minecraft text-xs">
                      <CrownIcon className="w-3 h-3 mr-1" />
                      Ultimate
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-2">{plan.icon}</div>
                  <CardTitle className="font-minecraft text-lg">
                    {plan.name}
                  </CardTitle>
                  <p className="font-minecraft text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    {plan.price.monthly === 0 ? (
                      <div className="font-minecraft text-2xl font-bold text-primary">
                        Free
                      </div>
                    ) : (
                      <>
                        <div className="font-minecraft text-2xl font-bold text-primary">
                          ${price.toFixed(2)}
                          <span className="text-sm text-muted-foreground">/month</span>
                        </div>
                        {annualBilling && savings.amount > 0 && (
                          <div className="font-minecraft text-xs text-green-600">
                            Save ${savings.amount.toFixed(2)}/year ({savings.percentage}% off)
                          </div>
                        )}
                      </>
                    )}
                    <div className="font-minecraft text-lg font-bold text-secondary mt-2">
                      {plan.storageDisplay}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="font-minecraft text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Action Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id, billingCycle)}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                    className={`
                      w-full block-button font-minecraft text-xs
                      ${isCurrentPlan 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : plan.rarity === 'legendary' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : plan.rarity === 'epic'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                            : 'bg-primary hover:bg-primary/90'
                      }
                    `}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.price.monthly === 0 ? (
                      'Get Started'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="font-minecraft text-xl text-primary mb-6">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="minecraft-card p-6 bg-card/50">
              <h4 className="font-minecraft text-sm font-bold mb-2">
                Can I change plans anytime?
              </h4>
              <p className="font-minecraft text-xs text-muted-foreground">
                Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="minecraft-card p-6 bg-card/50">
              <h4 className="font-minecraft text-sm font-bold mb-2">
                What happens to my files if I downgrade?
              </h4>
              <p className="font-minecraft text-xs text-muted-foreground">
                Your files remain safe. You'll need to delete some files if you exceed the new storage limit.
              </p>
            </div>
            <div className="minecraft-card p-6 bg-card/50">
              <h4 className="font-minecraft text-sm font-bold mb-2">
                Is there a refund policy?
              </h4>
              <p className="font-minecraft text-xs text-muted-foreground">
                Yes! We offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
            <div className="minecraft-card p-6 bg-card/50">
              <h4 className="font-minecraft text-sm font-bold mb-2">
                Do you offer team plans?
              </h4>
              <p className="font-minecraft text-xs text-muted-foreground">
                Our Pro and Max plans include team collaboration features with shared storage.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}