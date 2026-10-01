import { ArrowRightIcon, CheckCircle2Icon, ClockIcon, CloudUploadIcon, DownloadIcon, Loader2Icon, Music2Icon, PauseCircleIcon, PlayIcon, RssIcon, TimerIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ErrorState } from '@/components/states'
import { useRunTask, useTasks, useToggleTask } from '@/api/admin'
import { relativeMs, timeOf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Task, TaskName } from '@/types'

const ICON: Record<TaskName, React.ComponentType<{ className?: string }>> = {
  fetch: RssIcon,
  download: DownloadIcon,
  upload: CloudUploadIcon,
  match: Music2Icon,
}

export function TaskStatusIcon({ task }: { task: Task }) {
  if (task.running) return <Loader2Icon className="size-4 shrink-0 animate-spin text-info" />
  if (!task.enabled) return <PauseCircleIcon className="size-4 shrink-0 text-muted-foreground" />
  if (task.last_status === 'ok') return <CheckCircle2Icon className="size-4 shrink-0 text-success" />
  if (task.last_status === 'timeout') return <TimerIcon className="size-4 shrink-0 text-warning" />
  if (task.last_status === 'failed') return <XCircleIcon className="size-4 shrink-0 text-destructive" />
  return <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
}

function StatusBadge({ task }: { task: Task }) {
  if (task.running)
    return (
      <Badge className="bg-info/10 text-info">
        <Loader2Icon className="animate-spin" />
        运行中
      </Badge>
    )
  if (task.run_requested) return <Badge className="bg-info/10 text-info">已请求执行</Badge>
  if (!task.enabled) return <Badge variant="secondary">{task.paused_reason ? '已自动暂停' : '已关闭'}</Badge>
  if (task.last_status === 'ok') return <Badge className="bg-success/10 text-success">上轮成功</Badge>
  if (task.last_status === 'timeout') return <Badge className="bg-warning/15 text-warning">上轮超时</Badge>
  if (task.last_status === 'failed') return <Badge variant="destructive">上轮失败</Badge>
  return <Badge variant="outline">未运行</Badge>
}

export function TasksPage() {
  const { data, isPending, isError, error, refetch } = useTasks()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">后台任务</h2>
          <p className="text-sm text-muted-foreground">四个阶段由 worker 按间隔调度，每轮为独立子进程；本页每 10 秒自动刷新</p>
        </div>
        {data && (
          <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm">
            <span className={cn('size-2 rounded-full', data.worker.online ? 'bg-success' : 'bg-destructive')} />
            Worker {data.worker.online ? '在线' : '离线'}
            {data.worker.heartbeat_at && <span className="text-muted-foreground">· 心跳 {relativeMs(new Date(data.worker.heartbeat_at).getTime())}</span>}
          </div>
        )}
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data.tasks.map((t, i) => {
              const Icon = ICON[t.name] ?? ClockIcon
              return (
                <span key={t.name} className="flex items-center gap-2">
                  <span className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1', t.enabled ? 'bg-card text-foreground' : 'border-dashed')}>
                    <Icon className="size-3.5" />
                    {t.label}
                  </span>
                  {i < data.tasks.length - 1 && <ArrowRightIcon className="size-3.5" />}
                </span>
              )
            })}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.tasks.map((t) => (
              <TaskCard key={t.name} task={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const Icon = ICON[task.name] ?? ClockIcon
  const toggle = useToggleTask()
  const run = useRunTask()
  const runDisabledReason = !task.enabled ? '阶段已关闭，无法执行' : task.running ? '正在运行中' : task.run_requested ? '已请求执行，等待 worker 拾取' : null

  return (
    <Card className={cn(!task.enabled && 'bg-muted/30')}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('grid size-10 place-items-center rounded-xl', task.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {task.label}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-normal text-muted-foreground">{task.name}</code>
            </CardTitle>
            <CardDescription>
              每 {task.interval_minutes} 分钟 · 超时 {task.timeout_minutes} 分钟
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Switch checked={task.enabled} disabled={toggle.isPending} onCheckedChange={(enabled) => toggle.mutate({ name: task.name, enabled })} aria-label={`开关${task.label}`} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {task.paused_reason && (
          <Alert variant="destructive">
            <PauseCircleIcon />
            <AlertTitle>已自动暂停</AlertTitle>
            <AlertDescription>{task.paused_reason}。重新开启后会清空连续失败计数。</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between gap-3">
          <StatusBadge task={task} />
          {task.consecutive_failures > 0 && <span className="text-xs text-destructive">连续失败 {task.consecutive_failures} 个稿件</span>}
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-background p-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">上次开始</dt>
            <dd className="font-medium tabular-nums">{timeOf(task.last_started_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">上次结束</dt>
            <dd className="font-medium tabular-nums">{timeOf(task.last_finished_at)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">上轮摘要</dt>
            <dd className="font-medium">{task.last_summary ?? '—'}</dd>
          </div>
        </dl>
        {task.last_error && (
          <div className="space-y-1.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <TriangleAlertIcon className="size-3.5" />
              最近错误 · {timeOf(task.last_error_at)}
            </p>
            {task.last_error_item && <p className="truncate text-xs">{task.last_error_item}</p>}
            <p className="font-mono text-xs break-all whitespace-pre-wrap text-muted-foreground">{task.last_error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="sm" disabled={!!runDisabledReason || run.isPending} onClick={() => run.mutate(task.name)}>
                <PlayIcon />
                立即执行
              </Button>
            </span>
          </TooltipTrigger>
          {runDisabledReason && <TooltipContent>{runDisabledReason}</TooltipContent>}
        </Tooltip>
      </CardFooter>
    </Card>
  )
}
