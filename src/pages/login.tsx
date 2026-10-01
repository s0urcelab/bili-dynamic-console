import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRoundIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { useIsAdmin, useLogin } from '@/api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/manage'
  const isAdmin = useIsAdmin()
  const login = useLogin()
  const [password, setPassword] = useState('')

  if (isAdmin && !login.isSuccess) return <Navigate to={from} replace />

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-muted/40 p-4">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[480px] rounded-full bg-sky-400/20 blur-3xl" />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-sm space-y-6">
        <Logo className="justify-center text-lg" />
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">登录管理后台</CardTitle>
            <CardDescription>输入管理密码以继续</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!password) return
                login.mutate(password, { onSuccess: () => navigate(from, { replace: true }) })
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <KeyRoundIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-10 pl-9"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={login.isError || undefined}
                  />
                </div>
              </div>
              <Button type="submit" className="h-10 w-full" disabled={!password || login.isPending}>
                {login.isPending && <Loader2Icon className="animate-spin" />}
                登录
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">登录状态保持 2 周，到期前自动续期</p>
      </div>
    </div>
  )
}
