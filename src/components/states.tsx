import { useEffect, useRef } from 'react'
import { InboxIcon, Loader2Icon, RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function EmptyState({ title = '暂无数据', description, className }: { title?: string; description?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground', className)}>
      <InboxIcon className="size-10 opacity-40" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error: Error | null; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <TriangleAlertIcon className="size-10 text-destructive/70" />
      <p className="text-sm text-muted-foreground">{error?.message ?? '加载失败'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon />
          重试
        </Button>
      )}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2Icon className={cn('size-5 animate-spin text-muted-foreground', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-svh place-items-center">
      <Spinner className="size-8" />
    </div>
  )
}

/** 进入视口时触发 onVisible，用于无限滚动 */
export function LoadMoreSentinel({ onVisible, disabled }: { onVisible: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const callback = useRef(onVisible)

  useEffect(() => {
    callback.current = onVisible
  })

  useEffect(() => {
    if (disabled || !ref.current) return
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && callback.current(), { rootMargin: '600px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [disabled])

  return <div ref={ref} aria-hidden className="h-px" />
}

export function EndOfList({ text = '没有更多了' }: { text?: string }) {
  return (
    <div className="flex items-center gap-4 py-6 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      {text}
      <Separator className="flex-1" />
    </div>
  )
}
