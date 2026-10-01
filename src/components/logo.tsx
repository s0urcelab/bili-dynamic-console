import { cn } from '@/lib/utils'

export function Logo({ className, titleClassName, compact = false }: { className?: string; titleClassName?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3l3 3M17 3l-3 3" />
          <rect x="3" y="6" width="18" height="14" rx="3" />
          <path d="M10 11v4M14 11v4" />
        </svg>
      </span>
      {!compact && <span className={cn('text-base', titleClassName)}>Roast Chicken Collection</span>}
    </span>
  )
}
