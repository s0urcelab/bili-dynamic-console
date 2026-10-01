import { AlertTriangleIcon, BatteryChargingIcon, CircleDashedIcon, CloudIcon, FileXIcon, HardDriveIcon, Loader2Icon, MonitorDownIcon, OctagonXIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const DSTATUS_LABEL: Record<number, string> = {
  0: '待下载',
  100: '下载中',
  200: '本地',
  201: '云盘',
  [-1]: '下载失败',
  [-2]: '文件缺失',
  [-3]: '分辨率不达标',
  [-9]: '获取详情失败',
  [-11]: '充电专属',
}

const STYLE: Record<number, { cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  0: { cls: 'bg-muted text-muted-foreground', icon: CircleDashedIcon },
  100: { cls: 'bg-info/10 text-info', icon: Loader2Icon },
  200: { cls: 'bg-success/10 text-success', icon: HardDriveIcon },
  201: { cls: 'bg-success/10 text-success', icon: CloudIcon },
  [-1]: { cls: 'bg-destructive/10 text-destructive', icon: OctagonXIcon },
  [-2]: { cls: 'bg-destructive/10 text-destructive', icon: FileXIcon },
  [-3]: { cls: 'bg-warning/15 text-warning', icon: MonitorDownIcon },
  [-9]: { cls: 'bg-destructive/10 text-destructive', icon: AlertTriangleIcon },
  [-11]: { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: BatteryChargingIcon },
}

export function DStatusBadge({ dstatus, label, retry }: { dstatus: number; label?: string; retry?: number }) {
  const s = STYLE[dstatus] ?? STYLE[-9]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap', s.cls)}>
      <Icon className={cn('size-3.5', dstatus === 100 && 'animate-spin')} />
      {label || DSTATUS_LABEL[dstatus] || `未知(${dstatus})`}
      {retry ? <span className="opacity-70">×{retry}</span> : null}
    </span>
  )
}
