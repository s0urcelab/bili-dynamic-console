import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutDashboardIcon, LogInIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ImportDialog } from '@/components/import-video-dialog'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { useIsAdmin } from '@/api/auth'

export function PublicLayout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const keyword = params.get('keyword') ?? ''

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 md:px-8">
          <Link to="/" className="shrink-0">
            <Logo titleClassName="max-md:sr-only" />
          </Link>
          <form
            className="mx-auto w-full max-w-xl"
            onSubmit={(e) => {
              e.preventDefault()
              const kw = new FormData(e.currentTarget).get('keyword')?.toString().trim()
              navigate(kw ? `/?keyword=${encodeURIComponent(kw)}` : '/')
            }}
          >
            <InputGroup className="h-10 rounded-full bg-muted/60 shadow-none">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput name="keyword" key={keyword} defaultValue={keyword} placeholder="搜索稿件标题、BGM 或 UP 主" />
            </InputGroup>
          </form>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <AccountMenu />
            <ImportShortcut />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}

/** 已登录时的快捷入口：直接打开「导入稿件」弹窗 */
function ImportShortcut() {
  const isAdmin = useIsAdmin()

  if (!isAdmin) return null

  return (
    <ImportDialog
      trigger={
        <Button aria-label="导入稿件" className="max-sm:size-8 max-sm:px-0">
          <PlusIcon />
          <span className="max-sm:hidden">导入稿件</span>
        </Button>
      }
    />
  )
}

function AccountMenu() {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return (
      <Button variant="ghost" size="icon" aria-label="登录" asChild>
        <Link to="/login">
          <LogInIcon />
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="icon" aria-label="管理后台" asChild>
      <Link to="/manage">
        <LayoutDashboardIcon />
      </Link>
    </Button>
  )
}
