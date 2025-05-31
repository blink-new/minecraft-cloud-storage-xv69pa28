import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Dashboard } from '../components/dashboard/Dashboard'
import { supabase, FileItem } from '../lib/supabase'
import { calculateTotalUsage } from '../lib/plans'

export function DashboardPage() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [userPlanId, setUserPlanId] = useState('free')
  const [totalUsedStorage, setTotalUsedStorage] = useState(0)

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

  const handleUpgradeClick = () => {
    navigate('/pricing')
  }

  const handleNavigateToSettings = () => {
    navigate('/settings')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
        <div className="minecraft-card w-24 h-24 flex items-center justify-center bg-primary animate-pulse">
          <span className="font-minecraft text-2xl text-primary-foreground">⚡</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <Dashboard 
      folderId={folderId}
      onUpgradeClick={handleUpgradeClick} 
      onNavigateToSettings={handleNavigateToSettings}
    />
  )
}