import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { Loader2, LogIn } from 'lucide-react'
import { useExternalLogin } from '../../hooks/useExternalLogin'
import { useToast } from '../../hooks/use-toast'

interface LoginModalProps {
  onLoginSuccess?: (response: any) => void
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })

  const { login, isLoading, error, isAuthenticated, refetchToken } = useExternalLogin()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    login(credentials, {
      onSuccess: (data) => {
        toast({
          title: "Login Successful",
          description: data.result?.mensaje || "Successfully authenticated",
        })
        onLoginSuccess?.(data)
        setIsOpen(false)
        setCredentials({ username: '', password: '' })
        // Immediately refresh the token state to update UI
        refetchToken()
      },
      onError: (error) => {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        })
      }
    })
  }

  const handleInputChange = (field: 'username' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const resetForm = () => {
    setCredentials({ username: '', password: '' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          {isAuthenticated ? 'External Login (Active)' : 'External Login'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            External System Login
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={handleInputChange('username')}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}