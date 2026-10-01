import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage({ title = '页面不存在' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="bg-gradient-to-br from-primary to-sky-400 bg-clip-text text-7xl font-bold text-transparent">404</p>
      <p className="text-lg font-medium">{title}</p>
      <Button asChild>
        <Link to="/">回到首页</Link>
      </Button>
    </div>
  )
}
