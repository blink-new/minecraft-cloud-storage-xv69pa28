import React from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  formatBytes, 
  calculateUsagePercentage, 
  getUsageColor, 
  shouldShowUpgradePrompt,
  getPlanById,
  STORAGE_PLANS 
} from '../../lib/plans'
import { CrownIcon, TrendingUpIcon } from 'lucide-react'

interface StorageUsageProps {
  totalUsed: number
  currentPlan: string
  onUpgradeClick: () => void
}

export function StorageUsage({ totalUsed, currentPlan, onUpgradeClick }: StorageUsageProps) {
  const plan = getPlanById(currentPlan) || STORAGE_PLANS[0]
  const usagePercentage = calculateUsagePercentage(totalUsed, plan.storage)
  const usageColorClass = getUsageColor(usagePercentage)
  const showUpgrade = shouldShowUpgradePrompt(totalUsed, plan.storage)
  
  // Get next plan for upgrade suggestion
  const currentPlanIndex = STORAGE_PLANS.findIndex(p => p.id === currentPlan)
  const nextPlan = currentPlanIndex < STORAGE_PLANS.length - 1 ? STORAGE_PLANS[currentPlanIndex + 1] : null

  return (
    <Card className="minecraft-card bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-minecraft text-sm flex items-center gap-2">
            <span className="text-lg">{plan.icon}</span>
            {plan.name}
            {currentPlan !== 'free' && (
              <Badge variant="secondary" className="font-minecraft text-xs">
                <CrownIcon className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </CardTitle>
          {showUpgrade && nextPlan && (
            <Button
              size="sm"
              onClick={onUpgradeClick}
              className="block-button bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-minecraft text-xs"
            >
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-minecraft text-xs text-muted-foreground">
              Storage Used
            </span>
            <span className={`font-minecraft text-xs font-bold ${usageColorClass}`}>
              {formatBytes(totalUsed)} / {plan.storageDisplay}
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-2 minecraft-progress"
            style={{
              background: 'rgba(0,0,0,0.2)'
            }}
          />
          
          <div className="flex justify-between items-center">
            <span className={`font-minecraft text-xs ${usageColorClass}`}>
              {usagePercentage.toFixed(1)}% used
            </span>
            <span className="font-minecraft text-xs text-muted-foreground">
              {formatBytes(plan.storage - totalUsed)} remaining
            </span>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {showUpgrade && nextPlan && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-minecraft text-xs font-bold text-amber-800 dark:text-amber-200">
                  Running out of space?
                </p>
                <p className="font-minecraft text-xs text-amber-700 dark:text-amber-300">
                  Upgrade to {nextPlan.name} for {nextPlan.storageDisplay}
                </p>
              </div>
              <Button
                size="sm"
                onClick={onUpgradeClick}
                className="block-button bg-amber-500 hover:bg-amber-600 font-minecraft text-xs"
              >
                ${nextPlan.price.monthly}/mo
              </Button>
            </div>
          </div>
        )}

        {/* Plan Features Quick View */}
        {currentPlan !== 'free' && (
          <div className="space-y-2">
            <p className="font-minecraft text-xs text-muted-foreground">
              Active Features:
            </p>
            <div className="flex flex-wrap gap-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="font-minecraft text-xs">
                  {feature}
                </Badge>
              ))}
              {plan.features.length > 3 && (
                <Badge variant="outline" className="font-minecraft text-xs">
                  +{plan.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}