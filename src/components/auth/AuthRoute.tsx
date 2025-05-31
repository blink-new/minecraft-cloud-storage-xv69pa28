import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthForm } from './AuthForm'

export function AuthRoute() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
        <div className="minecraft-card w-24 h-24 flex items-center justify-center bg-primary animate-pulse">
          <span className="font-minecraft text-2xl text-primary-foreground">⚡</span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthForm
      mode={authMode}
      onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
    />
  )
}