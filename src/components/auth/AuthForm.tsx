import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(mode === 'signin' ? 'Welcome back!' : 'Account created successfully!')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
      <div className="w-full max-w-md">
        <Card className="minecraft-card border-4">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary minecraft-card rounded-none flex items-center justify-center">
              <span className="font-minecraft text-xl text-primary-foreground">📦</span>
            </div>
            <CardTitle className="font-minecraft text-2xl text-primary">
              CraftBox
            </CardTitle>
            <CardDescription className="font-minecraft text-sm">
              {mode === 'signin' ? 'Welcome back, crafter!' : 'Join the crafting world!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-minecraft text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block-button h-12 font-mono"
                  placeholder="steve@minecraft.net"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-minecraft text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block-button h-12 font-mono"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full block-button h-12 bg-primary hover:bg-primary/90 font-minecraft text-xs"
              >
                {loading ? 'Loading...' : mode === 'signin' ? 'Enter World' : 'Create Player'}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                className="font-minecraft text-xs text-secondary hover:text-secondary/80"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Create one!" 
                  : 'Already have an account? Sign in!'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}