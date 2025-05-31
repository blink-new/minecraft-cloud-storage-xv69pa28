// Storage plans with Minecraft theming
export interface StoragePlan {
  id: string
  name: string
  displayName: string
  storage: number // in bytes
  storageDisplay: string
  price: {
    monthly: number
    annual: number
  }
  features: string[]
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
}

export const STORAGE_PLANS: StoragePlan[] = [
  {
    id: 'free',
    name: 'Starter Chest',
    displayName: 'Free',
    storage: 1 * 1024 * 1024 * 1024, // 1GB
    storageDisplay: '1 GB',
    price: {
      monthly: 0,
      annual: 0
    },
    features: [
      '1 GB storage',
      'Basic file sharing',
      'Mobile & web apps',
      'Community support'
    ],
    icon: '📦',
    rarity: 'common',
    description: 'Perfect for storing your first treasures'
  },
  {
    id: 'plus',
    name: 'Iron Vault',
    displayName: 'Plus',
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    storageDisplay: '100 GB',
    price: {
      monthly: 4.99,
      annual: 49.99 // 17% off
    },
    features: [
      '100 GB storage',
      'Advanced file sharing',
      'Version history (30 days)',
      'Priority support',
      'Advanced search'
    ],
    icon: '⚒️',
    rarity: 'rare',
    description: 'Upgrade your storage with iron-strong security'
  },
  {
    id: 'pro',
    name: 'Diamond Treasury',
    displayName: 'Pro',
    storage: 1024 * 1024 * 1024 * 1024, // 1TB
    storageDisplay: '1 TB',
    price: {
      monthly: 9.99,
      annual: 99.99 // 17% off
    },
    features: [
      '1 TB storage',
      'Team collaboration',
      'Version history (1 year)',
      'Advanced security',
      'API access',
      'Smart organization'
    ],
    icon: '💎',
    rarity: 'epic',
    description: 'Professional-grade storage for serious crafters'
  },
  {
    id: 'max',
    name: 'Netherite Fortress',
    displayName: 'Max',
    storage: 10 * 1024 * 1024 * 1024 * 1024, // 10TB
    storageDisplay: '10 TB',
    price: {
      monthly: 29.99,
      annual: 299.99 // 17% off
    },
    features: [
      '10 TB storage',
      'Unlimited team members',
      'Advanced analytics',
      'Custom branding',
      'Priority support',
      'Enterprise security',
      'Advanced admin controls'
    ],
    icon: '🏰',
    rarity: 'legendary',
    description: 'Ultimate storage fortress for enterprises'
  }
]

export function getPlanById(id: string): StoragePlan | undefined {
  return STORAGE_PLANS.find(plan => plan.id === id)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function calculateUsagePercentage(used: number, total: number): number {
  if (total === 0) return 0 // Avoid division by zero if total storage is 0 (e.g. for a new free plan)
  return Math.min((used / total) * 100, 100)
}

export function calculateTotalUsage(allFiles: { size: number; type: string }[]): number {
  return allFiles.reduce((total, file) => {
    return file.type === 'file' ? total + file.size : total
  }, 0)
}

export function getUsageColor(percentage: number): string {
  if (percentage < 60) return 'text-green-500'
  if (percentage < 80) return 'text-yellow-500'
  return 'text-red-500'
}

export function shouldShowUpgradePrompt(used: number, total: number): boolean {
  if (total === 0) return false // Don't prompt if total is 0
  return (used / total) > 0.8 // Show when 80% full
}