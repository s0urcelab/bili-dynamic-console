import { Link } from 'react-router-dom'
import { AlertTriangleIcon, ArrowRightIcon, CloudIcon, CloudUploadIcon, FilmIcon, HardDriveIcon, Music2Icon, SparklesIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { DStatusBadge } from '@/components/dstatus-badge'
import { EmptyState, ErrorState } from '@/components/states'
import { TaskStatusIcon } from '@/pages/admin/tasks'
import { useAdminVideos, useRetryDownload, useStats, useStorage, useTasks } from '@/api/admin'
import { formatBytes, timeOf } from '@/lib/format'
import { imgUrl } from '@/lib/video'

const STATUS_COLOR: Record<number, string> = {
  201: 'var(--chart-3)',
  200: 'var(--chart-2)',
  0: 'var(--muted-foreground)',
  100: 'var(--info)',
  [-1]: 'var(--destructive)',
  [-2]: 'var(--chart-5)',
  [-3]: 'var(--warning)',
  [-9]: 'var(--destructive)',
  [-11]: 'var(--chart-4)',
}

export function DashboardPage() {
  const tasks = useTasks()
  const paused = tasks.data?.tasks.filter((t) => t.paused_reason) ?? []

  return (
    <div className="space-y-6">
      {tasks.data && !tasks.data.worker.online && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Worker 离线</AlertTitle>
          <AlertDescription>超过 60 秒没有收到心跳，后台任务不会运行。</AlertDescription>
        </Alert>
      )}
      {paused.map((t) => (
        <Alert key={t.name} variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>{t.label}已自动暂停</AlertTitle>
          <AlertDescription>
            <p>{t.paused_reason}</p>
            <Button size="sm" variant="outline" className="mt-2" asChild>
              <Link to={t.name === 'download' ? '/manage/settings' : '/manage/tasks'}>前往处理</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      <StatCards />

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusDistribution />
        <StorageCard />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>后台任务</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/manage/tasks">
                  全部
                  <ArrowRightIcon />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {tasks.isPending
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11" />)
              : tasks.data?.tasks.map((t) => (
                  <div key={t.name} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                    <TaskStatusIcon task={t} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.last_summary ?? '尚未运行'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{timeOf(t.last_finished_at)}</span>
                  </div>
                ))}
          </CardContent>
        </Card>
        <FailedVideos />
      </div>
    </div>
  )
}

function StatCards() {
  const { data: stats, isPending } = useStats()
  const items = [
    { icon: FilmIcon, label: '稿件总数', value: stats?.total, hint: '含全部下载状态' },
    { icon: SparklesIcon, label: '精选稿件', value: stats?.selected, hint: stats?.total ? `占比 ${Math.round((stats.selected / stats.total) * 100)}%` : '', accent: true },
    { icon: CloudUploadIcon, label: '等待上传', value: stats?.waiting_upload, hint: '已下载、未上传云盘' },
    { icon: Music2Icon, label: '等待识别 BGM', value: stats?.waiting_match, hint: '本地文件就绪' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, label, value, hint, accent }) => (
        <Card key={label} className={accent ? 'bg-gradient-to-br from-primary/10 to-transparent' : undefined}>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </CardDescription>
            {isPending ? <Skeleton className="h-9 w-24" /> : <CardTitle className="text-3xl font-semibold tabular-nums">{(value ?? 0).toLocaleString()}</CardTitle>}
            <p className="h-4 text-xs text-muted-foreground">{hint}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function StatusDistribution() {
  const { data: stats, isPending, isError, error, refetch } = useStats()
  const list = [...(stats?.by_dstatus ?? [])].sort((a, b) => b.count - a.count)

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>下载状态分布</CardTitle>
        <CardDescription>按下载流水线状态统计全部稿件</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} className="py-6" />
        ) : isPending ? (
          <Skeleton className="h-32" />
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {list.map((d) => (
                <div
                  key={d.dstatus}
                  title={`${d.label} ${d.count}`}
                  style={{ width: `${(d.count / (stats!.total || 1)) * 100}%`, background: STATUS_COLOR[d.dstatus] ?? 'var(--muted-foreground)' }}
                  className="h-full min-w-[3px] border-r-2 border-card last:border-r-0"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              {list.map((d) => (
                <div key={d.dstatus} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[d.dstatus] ?? 'var(--muted-foreground)' }} />
                  <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
                  <span className="font-medium tabular-nums">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StorageCard() {
  const { data, isPending } = useStorage()
  const cloud = data?.cloud
  const pct = cloud?.used_bytes != null && cloud.total_bytes ? Math.round((cloud.used_bytes / cloud.total_bytes) * 100) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>存储空间</CardTitle>
        <CardDescription>本地缓存与云盘占用</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="grid size-11 place-items-center rounded-xl bg-info/10 text-info">
            <HardDriveIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">本地</p>
            {isPending ? <Skeleton className="h-7 w-24" /> : <p className="text-xl font-semibold tabular-nums">{formatBytes(data?.local_bytes)}</p>}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <CloudIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">云盘</p>
              {isPending ? (
                <Skeleton className="h-7 w-32" />
              ) : cloud?.error ? (
                <p className="truncate text-sm text-destructive" title={cloud.error}>
                  获取失败：{cloud.error}
                </p>
              ) : (
                <p className="text-xl font-semibold tabular-nums">
                  {formatBytes(cloud?.used_bytes)}
                  <span className="text-sm font-normal text-muted-foreground"> / {formatBytes(cloud?.total_bytes)}</span>
                </p>
              )}
            </div>
            {pct !== null && <span className="text-sm font-medium tabular-nums">{pct}%</span>}
          </div>
          {pct !== null && <Progress value={pct} />}
        </div>
      </CardContent>
    </Card>
  )
}

function FailedVideos() {
  const { data, isPending } = useAdminVideos({ page: 1, size: 5, filter: 'download_failed' })
  const retry = useRetryDownload()

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>下载失败</CardTitle>
        <CardDescription>{data ? `共 ${data.total} 个稿件` : '需要处理的稿件'}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/manage/videos?filter=download_failed">
              查看全部
              <ArrowRightIcon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
        ) : !data?.items.length ? (
          <EmptyState title="没有下载失败的稿件" className="py-8" />
        ) : (
          data.items.map((v) => (
            <div key={v.vid} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
              <img src={imgUrl(v.cover)} alt="" referrerPolicy="no-referrer" className="aspect-video w-20 shrink-0 rounded-md bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title}</p>
                <p className="truncate font-mono text-xs text-muted-foreground" title={v.dl_error ?? undefined}>
                  {v.dl_error ?? v.vid}
                </p>
              </div>
              <DStatusBadge dstatus={v.dstatus} label={v.dstatus_label} retry={v.dl_retry} />
              <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate([v.vid])}>
                重试
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
