import { useState } from 'react'
import { CalendarRangeIcon, LinkIcon, Loader2Icon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DStatusBadge } from '@/components/dstatus-badge'
import { Spinner } from '@/components/states'
import { VideoPlayer } from '@/components/video-player'
import { useDeleteRange, useImportVideo, useSetOwner, useUpSearch } from '@/api/admin'
import { useUp, useUps, useVideoDetail } from '@/api/public'
import { useDebounced } from '@/hooks/use-debounced'
import { toDatetimeLocal } from '@/lib/format'
import { imgUrl, upOf } from '@/lib/video'
import type { Up, Video } from '@/types'

function parseLink(link: string) {
  const bv = link.match(/(BV[A-Za-z0-9]{10})(?:.*[?&]p=(\d+))?/)
  if (bv) return { source: 'bilibili' as const, vid: bv[1], p: Number(bv[2] ?? 1) }
  const ac = link.match(/(ac\d+)(?:_(\d+))?/i)
  if (ac) return { source: 'acfun' as const, vid: ac[1].toLowerCase(), p: Number(ac[2] ?? 1) }
  return null
}

export function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [p, setP] = useState('')
  const parsed = parseLink(link.trim())
  const importVideo = useImportVideo()

  const reset = () => {
    setLink('')
    setP('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          导入稿件
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            if (!parsed) return
            importVideo.mutate({ source: parsed.source, vid: parsed.vid, p: Number(p) || parsed.p }, { onSuccess: () => setOpen(false) })
          }}
        >
          <DialogHeader>
            <DialogTitle>手动导入稿件</DialogTitle>
            <DialogDescription>支持 B 站和 AcFun 链接，导入后自动精选。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-link">视频链接或 BV / ac 号</Label>
              <div className="relative">
                <LinkIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="import-link" autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.bilibili.com/video/BV1..." className="pl-9" />
              </div>
            </div>
            {link.trim() && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                {parsed ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={parsed.source === 'acfun' ? 'destructive' : 'default'}>{parsed.source === 'acfun' ? 'AcFun' : 'bilibili'}</Badge>
                    <code className="font-mono">{parsed.vid}</code>
                    <span className="text-muted-foreground">· P{Number(p) || parsed.p}</span>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-destructive">
                    <TriangleAlertIcon className="size-4" />
                    无法识别链接
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="import-p">分 P（可选，默认取链接中的分 P）</Label>
              <Input id="import-p" type="number" min={1} value={p} onChange={(e) => setP(e.target.value)} placeholder={String(parsed?.p ?? 1)} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!parsed || importVideo.isPending}>
              {importVideo.isPending && <Loader2Icon className="animate-spin" />}
              导入
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const ALL_UPS = 'all'

export function DeleteRangeDialog({ defaultUid }: { defaultUid?: string | null }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [uid, setUid] = useState<string>(ALL_UPS)
  const ups = useUps({ size: 50 }).data?.items ?? []
  const defaultUp = useUp(open && defaultUid && !ups.some((u) => String(u.uid) === defaultUid) ? defaultUid : undefined).data
  const options = defaultUp ? [defaultUp, ...ups] : ups
  const deleteRange = useDeleteRange()

  const startTs = start ? Math.floor(new Date(start).getTime() / 1000) : NaN
  const endTs = end ? Math.floor(new Date(end).getTime() / 1000) + 59 : NaN
  const valid = !Number.isNaN(startTs) && !Number.isNaN(endTs) && startTs <= endTs
  const upName = uid === ALL_UPS ? '全部 UP 主' : (options.find((u) => String(u.uid) === uid)?.uname ?? `UID ${uid}`)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          const now = Date.now()
          setStart(toDatetimeLocal(now - 30 * 86400_000))
          setEnd(toDatetimeLocal(now))
          setUid(defaultUid ?? ALL_UPS)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarRangeIcon />
          按时间清理
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>按发布时间批量清理</DialogTitle>
          <DialogDescription>删除区间内所有未精选的稿件及其本地、云盘文件。精选稿件不受影响。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="range-start">开始</Label>
              <Input id="range-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-end">结束</Label>
              <Input id="range-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>限定 UP 主（可选）</Label>
            <Select value={uid} onValueChange={setUid}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_UPS}>全部 UP 主</SelectItem>
                {defaultUid && !options.some((u) => String(u.uid) === defaultUid) && <SelectItem value={defaultUid}>UID {defaultUid}</SelectItem>}
                {options.map((u) => (
                  <SelectItem key={u.uid} value={String(u.uid)}>
                    {u.uname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!valid && start && end && <p className="text-sm text-destructive">开始时间不能晚于结束时间</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button variant="destructive" disabled={!valid || deleteRange.isPending} onClick={() => setConfirming(true)}>
            {deleteRange.isPending && <Loader2Icon className="animate-spin" />}
            清理
          </Button>
        </DialogFooter>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="确认清理？"
          description={`将删除 ${start.replace('T', ' ')} 至 ${end.replace('T', ' ')} 之间「${upName}」所有未精选的稿件及文件，不可撤销。`}
          confirmText="确认清理"
          onConfirm={() =>
            deleteRange.mutate({ start: startTs, end: endTs, uid: uid === ALL_UPS ? undefined : Number(uid) }, { onSuccess: () => setOpen(false) })
          }
        />
      </DialogContent>
    </Dialog>
  )
}

export function OwnerDialog({ video, onOpenChange }: { video: Video | null; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState('')
  const keyword = useDebounced(search.trim())
  const recent = useUps()
  const searched = useUpSearch(keyword)
  const setOwner = useSetOwner()
  const list: Up[] = keyword ? (searched.data ?? []) : (recent.data?.items ?? [])
  const loading = keyword ? searched.isFetching : recent.isPending
  return (
    <Dialog
      open={!!video}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setSearch('')
      }}
    >
      <DialogContent className="p-0 sm:max-w-md">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>修改归属 UP 主</DialogTitle>
          <DialogDescription className="truncate">{video?.title}</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="rounded-none border-t">
          <CommandInput placeholder="搜索 UP 主昵称..." value={search} onValueChange={setSearch} />
          <CommandList className="max-h-72">
            {loading ? (
              <div className="grid place-items-center py-6">
                <Spinner />
              </div>
            ) : (
              <CommandEmpty>{keyword ? '未找到相关 UP 主' : '输入昵称搜索 UP 主'}</CommandEmpty>
            )}
            {!!list.length && (
              <CommandGroup heading={keyword ? '搜索结果' : '最近更新'}>
                {list.map((u) => (
                  <CommandItem
                    key={u.uid}
                    value={String(u.uid)}
                    disabled={setOwner.isPending}
                    onSelect={() =>
                      video && setOwner.mutate({ vid: video.vid, uid: u.uid, uname: u.uname }, { onSuccess: () => onOpenChange(false) })
                    }
                    className="gap-3"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={imgUrl(u.avatar)} referrerPolicy="no-referrer" />
                      <AvatarFallback>{u.uname.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{u.uname}</span>
                    {video && u.uid === upOf(video).uid && <Badge variant="secondary">当前</Badge>}
                    <span className="font-mono text-xs text-muted-foreground">{u.uid}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function PreviewDialog({ video, onOpenChange }: { video: Video | null; onOpenChange: (open: boolean) => void }) {
  const { data, isPending } = useVideoDetail(video?.vid)
  const info = video?.video_info

  return (
    <Dialog open={!!video} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {video && (
          <>
            <div className="bg-black">
              {isPending ? (
                <Skeleton className="aspect-video rounded-none" />
              ) : data?.play_url ? (
                <VideoPlayer src={data.play_url} poster={imgUrl(video.cover)} autoplay />
              ) : (
                <div className="grid aspect-video place-items-center text-sm text-white/80">
                  <p className="flex items-center gap-2">
                    <TriangleAlertIcon className="size-4 text-warning" />
                    {data?.play_error || '无法获取播放地址'}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <DialogHeader>
                <DialogTitle className="pr-6">{video.title}</DialogTitle>
                <DialogDescription>
                  {upOf(video).uname} · {video.pdstr}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <DStatusBadge dstatus={video.dstatus} label={video.dstatus_label} />
                {video.low_res && <Badge className="bg-warning/15 text-warning">已保留低分辨率版本</Badge>}
                {info && (
                  <>
                    <Badge variant="outline" className="font-mono">
                      {info.width}×{info.height}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {info.fps} fps
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {(info.bitrate / 1e6).toFixed(1)} Mbps
                    </Badge>
                  </>
                )}
                {video.max_quality && <span className="text-muted-foreground">最高画质 {video.max_quality}</span>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
