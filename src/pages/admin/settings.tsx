import { useState } from 'react'
import { CalendarClockIcon, CheckCircle2Icon, CookieIcon, CrownIcon, Loader2Icon, RefreshCwIcon, ShieldAlertIcon, ShieldQuestionIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorState } from '@/components/states'
import { useCheckCookie, useCheckpoint, useCookies, useDeleteCookie, useSaveCookie, useSetCheckpoint } from '@/api/admin'
import { formatDate, timeOf, toDatetimeLocal } from '@/lib/format'
import type { CookieInfo } from '@/types'

const FORMAT_LABEL = { sessdata: 'SESSDATA 值', header: '请求头格式', netscape: 'cookies.txt' }
const USAGE = {
  subscribe: '读取关注分组和动态流',
  download: 'yt-dlp 下载视频，决定能拿到的最高画质',
}
const SOON_MS = 7 * 86400_000

export function SettingsPage() {
  const cookies = useCookies()

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">B 站 Cookie</h2>
          <p className="text-sm text-muted-foreground">后台保存的值优先于环境变量；保存后下一轮任务即生效，无需重启</p>
        </div>
        {cookies.isError ? (
          <ErrorState error={cookies.error} onRetry={() => cookies.refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {cookies.isPending ? (
              <>
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </>
            ) : (
              <>
                <CookieCard info={cookies.data.subscribe} />
                <CookieCard info={cookies.data.download} />
              </>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">系统</h2>
          <p className="text-sm text-muted-foreground">动态抓取进度</p>
        </div>
        <CheckpointCard />
      </section>
    </div>
  )
}

function CookieCard({ info }: { info: CookieInfo }) {
  const [now] = useState(Date.now)
  const expiresMs = info.expires_at ? new Date(info.expires_at).getTime() : null
  const expired = expiresMs !== null && expiresMs < now
  const expiresSoon = expiresMs !== null && !expired && expiresMs - now < SOON_MS
  const checkCookie = useCheckCookie()
  const deleteCookie = useDeleteCookie()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CookieIcon className="size-4 text-primary" />
          {info.label}
        </CardTitle>
        <CardDescription>{USAGE[info.kind]}</CardDescription>
        <CardAction>
          {info.source === 'admin' ? <Badge>后台配置</Badge> : info.source === 'env' ? <Badge variant="secondary">环境变量</Badge> : <Badge variant="outline">未配置</Badge>}
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {info.error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <ShieldAlertIcon className="size-5 shrink-0" />
            无法解析已保存的内容：{info.error}
          </div>
        )}
        <CheckResult info={info} />

        {info.configured && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">格式</dt>
              <dd className="font-medium">{info.format ? FORMAT_LABEL[info.format] : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">SESSDATA 过期</dt>
              <dd className={expired ? 'font-medium text-destructive' : expiresSoon ? 'font-medium text-warning' : 'font-medium'}>
                {expiresMs !== null ? formatDate(expiresMs).slice(0, 10) : '未知'}
                {expired && <span className="ml-1 text-xs">（已过期）</span>}
                {expiresSoon && <span className="ml-1 text-xs">（即将过期）</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">更新时间</dt>
              <dd className="font-medium">{timeOf(info.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">域名</dt>
              <dd className="font-medium break-all">{info.domains.join('  ') || '—'}</dd>
            </div>
            {!!info.names.length && (
              <div className="col-span-2">
                <dt className="mb-1.5 text-xs text-muted-foreground">包含字段</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {info.names.map((n) => (
                    <code key={n} className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-xs">
                      {n}
                    </code>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
      <CardFooter className="gap-2 border-t">
        <UpdateCookieDialog info={info} />
        <Button variant="outline" size="sm" disabled={!info.configured || checkCookie.isPending} onClick={() => checkCookie.mutate(info.kind)}>
          {checkCookie.isPending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
          重新检测
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" disabled={info.source !== 'admin' || deleteCookie.isPending}>
              <Trash2Icon />
              清除
            </Button>
          }
          title={`清除后台配置的${info.label}？`}
          description="清除后将回退使用环境变量中的配置。"
          confirmText="清除"
          onConfirm={() => deleteCookie.mutate(info.kind)}
        />
      </CardFooter>
    </Card>
  )
}

function CheckResult({ info }: { info: CookieInfo }) {
  const check = info.last_check
  if (!info.configured) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <ShieldQuestionIcon className="size-5 shrink-0" />
        尚未配置，请点击「更新」保存 cookie
      </div>
    )
  }
  if (!check) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <ShieldQuestionIcon className="size-5 shrink-0" />
        尚未检测登录状态
      </div>
    )
  }
  if (check.logged_in) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
        <CheckCircle2Icon className="size-5 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            已登录：{check.uname}
            {check.vip && (
              <Badge className="gap-1 bg-pink-500/15 text-pink-600 dark:text-pink-400">
                <CrownIcon />
                大会员
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            UID {check.uid} · 检测于 {timeOf(check.checked_at)}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <ShieldAlertIcon className="size-5 shrink-0 text-destructive" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-destructive">{check.logged_in === false ? '未登录或已失效' : '检测时网络出错'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {check.error ? `${check.error} · ` : ''}检测于 {timeOf(check.checked_at)}
        </p>
      </div>
    </div>
  )
}

function UpdateCookieDialog({ info }: { info: CookieInfo }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const save = useSaveCookie()

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setContent('')
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UploadIcon />
          更新
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>更新{info.label}</DialogTitle>
          <DialogDescription>保存后会立即检测一次登录状态。内容必须包含 bilibili.com 的 SESSDATA。</DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-3">
          <Textarea
            className="max-h-80 min-h-40 overflow-x-auto font-mono text-xs whitespace-pre"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'SESSDATA=...; bili_jct=...; buvid3=...\n\n或粘贴 Netscape cookies.txt 文件内容'}
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ['SESSDATA 值', 'abc123%2C17672…'],
              ['请求头格式', 'SESSDATA=…; bili_jct=…'],
              ['cookies.txt', '浏览器扩展导出'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border bg-muted/40 p-2">
                <p className="font-medium">{t}</p>
                <p className="truncate font-mono text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">格式会自动识别，开头的「Cookie:」可带可不带。</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button
            disabled={!content.trim() || save.isPending}
            onClick={() => save.mutate({ kind: info.kind, content: content.trim() }, { onSuccess: () => setOpen(false) })}
          >
            {save.isPending && <Loader2Icon className="animate-spin" />}
            保存并检测
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CheckpointCard() {
  const { data, isPending } = useCheckpoint()
  const setCheckpoint = useSetCheckpoint()
  const [value, setValue] = useState<string | null>(null)
  const [now] = useState(Date.now)
  const current = value ?? (data ? toDatetimeLocal(data.timestamp * 1000) : '')
  const ms = current ? new Date(current).getTime() : NaN
  const invalid = Number.isNaN(ms) || ms > now

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClockIcon className="size-4 text-primary" />
          动态截止时间
        </CardTitle>
        <CardDescription>获取动态阶段只抓取这个时间之后发布的动态，每轮结束后自动推进</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">当前截止</p>
          {isPending ? (
            <Skeleton className="my-1 h-8 w-56" />
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums">{data?.datetime}</p>
              <p className="font-mono text-xs text-muted-foreground">timestamp {data?.timestamp}</p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="checkpoint">手动设置（本地时间）</Label>
            <Input id="checkpoint" type="datetime-local" value={current} max={toDatetimeLocal(now)} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button
            disabled={!value || invalid || setCheckpoint.isPending}
            onClick={() => setCheckpoint.mutate(Math.floor(ms / 1000), { onSuccess: () => setValue(null) })}
          >
            {setCheckpoint.isPending && <Loader2Icon className="animate-spin" />}
            保存
          </Button>
        </div>
        <p className={value && invalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>不能晚于当前时间。往前调整会重新抓取这段时间内的动态。</p>
      </CardContent>
    </Card>
  )
}
