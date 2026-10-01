import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CookieIcon, ExternalLinkIcon, FilmIcon, GaugeIcon, LogOutIcon, WorkflowIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { FullPageSpinner } from '@/components/states'
import { ThemeToggle } from '@/components/theme-toggle'
import { useLogout, useMe } from '@/api/auth'
import { useCheckpoint, useTasks } from '@/api/admin'
import { relativeMs } from '@/lib/format'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/manage', label: '概览', icon: GaugeIcon, end: true },
  { to: '/manage/videos', label: '稿件管理', icon: FilmIcon },
  { to: '/manage/tasks', label: '后台任务', icon: WorkflowIcon },
  { to: '/manage/settings', label: 'Cookie 与系统', icon: CookieIcon },
]

export function AdminLayout() {
  const location = useLocation()
  const me = useMe()

  if (me.isPending) return <FullPageSpinner />
  if (!me.data?.logged_in) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  return <AdminShell />
}

function AdminShell() {
  const { pathname } = useLocation()
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  const tasks = useTasks()
  const checkpoint = useCheckpoint()
  const logout = useLogout()

  const worker = tasks.data?.worker
  const taskAlert = !!tasks.data && (!worker?.online || tasks.data.tasks.some((t) => t.paused_reason || t.last_status === 'failed'))

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <Logo />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>管理</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={current?.to === item.to} tooltip={item.label}>
                      <NavLink to={item.to} end={item.end}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {item.to === '/manage/tasks' && taskAlert && <SidebarMenuBadge className="text-destructive">!</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>前台</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="查看前台">
                    <Link to="/">
                      <ExternalLinkIcon />
                      <span>查看前台</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {worker && (
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2 text-xs group-data-[collapsible=icon]:hidden">
              <span className="relative flex size-2.5">
                {worker.online && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
                <span className={cn('relative inline-flex size-2.5 rounded-full', worker.online ? 'bg-success' : 'bg-destructive')} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Worker {worker.online ? '在线' : '离线'}</p>
                <p className="text-muted-foreground">{worker.heartbeat_at ? `心跳 ${relativeMs(new Date(worker.heartbeat_at).getTime())}` : '从未上报心跳'}</p>
              </div>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="退出登录" onClick={() => logout.mutate()}>
                <LogOutIcon />
                <span>退出登录</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-sm font-medium">{current?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            {checkpoint.data && (
              <Badge variant="outline" className="hidden font-normal sm:flex" asChild>
                <Link to="/manage/settings">动态截止 {checkpoint.data.datetime.slice(0, 16)}</Link>
              </Badge>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <ExternalLinkIcon />
                前台
              </Link>
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
