import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2Icon,
  CloudUploadIcon,
  ExternalLinkIcon,
  FileXIcon,
  MoreHorizontalIcon,
  Music2Icon,
  PencilLineIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserRoundPenIcon,
  XIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DStatusBadge } from '@/components/dstatus-badge'
import { EmptyState, ErrorState } from '@/components/states'
import {
  useAdminVideos,
  useDeleteVideos,
  useResetBgm,
  useRetryDownload,
  useRetryUpload,
  useSelectVideos,
  useSetBgmTitle,
  useStats,
} from '@/api/admin'
import { durationText } from '@/lib/format'
import { cn } from '@/lib/utils'
import { bgmState, canPreview, imgUrl, isAcfun, partOf, sourceLink, upOf } from '@/lib/video'
import type { AdminVideoFilter, Stats, Video } from '@/types'
import { DeleteRangeDialog, ImportDialog, OwnerDialog, PreviewDialog } from '@/pages/admin/video-dialogs'

const FILTERS: { value: AdminVideoFilter; label: string; count?: (s: Stats) => number; danger?: boolean }[] = [
  { value: 'all', label: '全部', count: (s) => s.total },
  { value: 'pending', label: '待下载', count: (s) => countOf(s, 0) + countOf(s, 100) },
  { value: 'local', label: '已下载', count: (s) => countOf(s, 200) },
  { value: 'archived', label: '已归档', count: (s) => countOf(s, 201) },
  { value: 'download_failed', label: '下载失败', danger: true },
  { value: 'upload_failed', label: '上传失败', danger: true },
  { value: 'selected', label: '精选', count: (s) => s.selected },
  { value: 'low_res', label: '分辨率不达标' },
]

const countOf = (s: Stats, dstatus: number) => s.by_dstatus.find((d) => d.dstatus === dstatus)?.count ?? 0

const PAGE_SIZES = ['50', '100', '200']

export function VideosPage() {
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') as AdminVideoFilter) || 'all'
  const uid = params.get('uid')
  const keyword = params.get('keyword')
  const page = Number(params.get('page')) || 1
  const size = PAGE_SIZES.includes(params.get('size') ?? '') ? Number(params.get('size')) : 50

  const list = useAdminVideos({ page, size, filter, uid, keyword })
  const stats = useStats()
  const videos = list.data?.items ?? []
  const total = list.data?.total ?? 0

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<Video | null>(null)
  const [owner, setOwner] = useState<Video | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)

  const clearSelection = () => setSelected(new Set())
  const deleteVideos = useDeleteVideos(clearSelection)

  const update = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (resetPage) next.delete('page')
    setParams(next)
    clearSelection()
  }

  const visibleVids = videos.map((v) => v.vid)
  const checkedCount = visibleVids.filter((v) => selected.has(v)).length
  const toggle = (vid: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(vid)) n.delete(vid)
      else n.add(vid)
      return n
    })

  const filterUp = uid ? videos.map(upOf).find((u) => String(u.uid) === uid) : undefined
  const filterUpName = filterUp?.uname ?? `UID ${uid}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">稿件管理</h2>
          <p className="text-sm text-muted-foreground">关注列表投稿与手动导入的全部稿件</p>
        </div>
        <div className="ml-auto flex gap-2">
          <DeleteRangeDialog defaultUid={uid} />
          <ImportDialog />
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <Tabs value={filter} onValueChange={(v) => update({ filter: v === 'all' ? null : v })}>
          <TabsList>
            {FILTERS.map((f) => {
              const n = stats.data && f.count?.(stats.data)
              return (
                <TabsTrigger key={f.value} value={f.value} className="gap-1.5 px-3">
                  {f.label}
                  {n !== undefined && (
                    <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', f.danger ? 'bg-destructive/10 text-destructive' : 'bg-muted-foreground/10 text-muted-foreground')}>
                      {n.toLocaleString()}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault()
            const kw = new FormData(e.currentTarget).get('keyword')?.toString().trim() || null
            update({ keyword: kw, uid: null })
          }}
        >
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput name="keyword" key={keyword} defaultValue={keyword ?? ''} placeholder="标题、BGM、UP 主昵称或精确 vid，回车搜索" />
            {keyword && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="清除搜索" onClick={() => update({ keyword: null })}>
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </form>
        {uid ? (
          <Badge variant="secondary" className="h-8 gap-1.5 rounded-lg pr-1 pl-2.5 text-sm">
            UP 主：{filterUpName}
            <Button variant="ghost" size="icon-xs" aria-label="清除" onClick={() => update({ uid: null })}>
              <XIcon />
            </Button>
          </Badge>
        ) : list.data?.ups?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">匹配的 UP 主：</span>
            {list.data.ups.slice(0, 8).map((u) => (
              <Button key={u.uid} variant="outline" size="xs" className="rounded-full" onClick={() => update({ uid: String(u.uid), keyword: null })}>
                {u.uname}
              </Button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">点击 UP 主昵称可快速筛选</span>
        )}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : (
          <div className={cn('transition-opacity', list.isPlaceholderData && 'opacity-60')}>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={videos.length > 0 && checkedCount === videos.length ? true : checkedCount ? 'indeterminate' : false}
                      onCheckedChange={(v) => setSelected(v ? new Set(visibleVids) : new Set())}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="w-[150px]">封面</TableHead>
                  <TableHead className="min-w-[280px]">标题</TableHead>
                  <TableHead className="min-w-[200px]">BGM</TableHead>
                  <TableHead>UP 主</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead>下载状态</TableHead>
                  <TableHead className="text-center">精选</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={9} className="px-4">
                          <Skeleton className="h-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  : videos.map((v) => (
                      <VideoRow
                        key={v.vid}
                        video={v}
                        checked={selected.has(v.vid)}
                        onCheck={() => toggle(v.vid)}
                        onPreview={() => setPreview(v)}
                        onOwner={() => setOwner(v)}
                        onDelete={() => setPendingDelete([v.vid])}
                        onFilterUp={() => update({ uid: String(upOf(v).uid), keyword: null })}
                      />
                    ))}
              </TableBody>
            </Table>
            {!list.isPending && !videos.length && <EmptyState title="没有符合条件的稿件" />}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 border-t px-4 py-3 text-sm">
          <span className="text-muted-foreground">共 {total.toLocaleString()} 条</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            每页
            <Select value={String(size)} onValueChange={(s) => update({ size: s === '50' ? null : s })}>
              <SelectTrigger size="sm" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PageNav page={page} pageCount={Math.max(1, Math.ceil(total / size))} onChange={(p) => update({ page: p > 1 ? String(p) : null }, false)} />
        </div>
      </Card>

      <BulkBar
        vids={[...selected]}
        onClear={clearSelection}
        onDelete={() => setPendingDelete([...selected])}
      />
      <PreviewDialog video={preview} onOpenChange={(o) => !o && setPreview(null)} />
      <OwnerDialog video={owner} onOpenChange={(o) => !o && setOwner(null)} />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`彻底删除 ${pendingDelete?.length ?? 0} 个稿件？`}
        description="会同时删除稿件记录，以及本地和云盘上的视频、封面，不可撤销。"
        confirmText="删除"
        onConfirm={() => pendingDelete && deleteVideos.mutate(pendingDelete)}
      />
    </div>
  )
}

type RowProps = {
  video: Video
  checked: boolean
  onCheck: () => void
  onPreview: () => void
  onOwner: () => void
  onDelete: () => void
  onFilterUp: () => void
}

function VideoRow({ video: v, checked, onCheck, onPreview, onOwner, onDelete, onFilterUp }: RowProps) {
  const up = upOf(v)
  const p = partOf(v)
  const select = useSelectVideos()
  const previewable = canPreview(v)

  return (
    <TableRow data-state={checked ? 'selected' : undefined} className="group">
      <TableCell className="pl-4">
        <Checkbox checked={checked} onCheckedChange={onCheck} aria-label="选择" />
      </TableCell>
      <TableCell>
        <button className="relative block aspect-video w-[136px] overflow-hidden rounded-md bg-muted disabled:cursor-default" disabled={!previewable} onClick={onPreview}>
          <img src={imgUrl(v.cover)} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
          <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 font-mono text-[10px] text-white">{durationText(v)}</span>
          {previewable && (
            <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <PlayIcon className="size-6 fill-white text-white" />
            </span>
          )}
        </button>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="space-y-1.5">
          <a href={sourceLink(v)} target="_blank" rel="noreferrer" className="line-clamp-2 font-medium hover:text-primary">
            {v.title}
          </a>
          <div className="flex flex-wrap items-center gap-1">
            {isAcfun(v) && <Badge variant="destructive">AcFun</Badge>}
            {v.source === 1 && <Badge variant="outline">手动导入</Badge>}
            {p > 1 && <Badge className="bg-info/10 text-info">P{p}</Badge>}
            {v.max_quality && <Badge variant="secondary">{v.max_quality}</Badge>}
            {!!v.is_portrait && <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400">竖屏</Badge>}
            <code className="font-mono text-[11px] text-muted-foreground">{v.vid}</code>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <BgmCell video={v} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <button className="max-w-28 truncate text-left hover:text-primary hover:underline" onClick={onFilterUp}>
            {up.uname}
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={onOwner} aria-label="修改归属">
                <UserRoundPenIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>修改归属</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{v.pdstr}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          {v.dl_error ? (
            <Tooltip>
              <TooltipTrigger>
                <DStatusBadge dstatus={v.dstatus} label={v.dstatus_label} retry={v.dl_retry} />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm font-mono break-all">{v.dl_error}</TooltipContent>
            </Tooltip>
          ) : (
            <DStatusBadge dstatus={v.dstatus} label={v.dstatus_label} retry={v.dl_retry} />
          )}
          {v.dl_requested && <span className="text-xs text-info">已请求重新下载</span>}
          {v.cloud_error && (
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1 text-xs text-destructive">
                <CloudUploadIcon className="size-3" />
                上传失败 ×{v.cloud_retry}
              </TooltipTrigger>
              <TooltipContent className="max-w-sm font-mono break-all">{v.cloud_error}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={v.selected ? '取消精选' : '精选'}
          disabled={select.isPending}
          onClick={() => select.mutate({ vids: [v.vid], selected: !v.selected })}
          className={v.selected ? 'text-amber-500 hover:text-amber-500' : 'text-muted-foreground/50'}
        >
          <StarIcon className={v.selected ? 'fill-current' : undefined} />
        </Button>
      </TableCell>
      <TableCell className="pr-4">
        <RowActions video={v} onPreview={onPreview} onOwner={onOwner} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  )
}

const BGM_HINT = {
  recognized: 'Shazam 已识别；修改的是曲目标题，所有使用该曲目的稿件都会变化',
  manual: '手动填写的标题',
  pending: '待识别',
  no_match: 'Shazam 无匹配',
  no_file: '没有本地文件，无法识别',
  error: '识别出错',
}

function BgmCell({ video }: { video: Video }) {
  const state = bgmState(video)
  const setTitle = useSetBgmTitle()
  const initial = video.bgm_title ?? ''

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0">
            {state === 'recognized' ? (
              <CheckCircle2Icon className="size-4 text-success" />
            ) : state === 'manual' ? (
              <PencilLineIcon className="size-4 text-info" />
            ) : state === 'pending' ? (
              <Music2Icon className="size-4 animate-pulse text-muted-foreground" />
            ) : state === 'no_file' ? (
              <FileXIcon className="size-4 text-muted-foreground" />
            ) : (
              <TriangleAlertIcon className="size-4 text-warning" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>{BGM_HINT[state]}</TooltipContent>
      </Tooltip>
      <input
        key={initial}
        defaultValue={initial}
        disabled={setTitle.isPending}
        placeholder={state === 'pending' ? '识别中…' : '填写 BGM 标题'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            e.currentTarget.value = initial
            e.currentTarget.blur()
          }
        }}
        onBlur={(e) => {
          const title = e.currentTarget.value.trim()
          if (title && title !== initial) setTitle.mutate({ vid: video.vid, title })
          else e.currentTarget.value = initial
        }}
        className="h-7 w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 text-sm transition-colors outline-none placeholder:text-muted-foreground/60 hover:border-input focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
      />
    </div>
  )
}

function RowActions({ video, onPreview, onOwner, onDelete }: { video: Video; onPreview: () => void; onOwner: () => void; onDelete: () => void }) {
  const select = useSelectVideos()
  const retryDownload = useRetryDownload()
  const retryUpload = useRetryUpload()
  const resetBgm = useResetBgm()
  const vids = [video.vid]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="更多">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onPreview} disabled={!canPreview(video)}>
          <PlayIcon />
          预览
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={sourceLink(video)} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            打开原稿件
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => select.mutate({ vids, selected: !video.selected })}>
          {video.selected ? <StarOffIcon /> : <StarIcon />}
          {video.selected ? '取消精选' : '精选'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => retryDownload.mutate(vids)} disabled={video.dstatus === 100}>
          <RotateCcwIcon />
          重新下载
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => retryUpload.mutate(vids)} disabled={video.dstatus !== 200}>
          <CloudUploadIcon />
          重试上传
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => resetBgm.mutate(vids)} disabled={video.dstatus !== 200}>
          <Music2Icon />
          重新识别 BGM
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOwner}>
          <UserRoundPenIcon />
          修改归属 UP 主
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon />
          彻底删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BulkBar({ vids, onClear, onDelete }: { vids: string[]; onClear: () => void; onDelete: () => void }) {
  const select = useSelectVideos()
  const retryDownload = useRetryDownload()
  const retryUpload = useRetryUpload()
  const resetBgm = useResetBgm()
  const busy = select.isPending || retryDownload.isPending || retryUpload.isPending || resetBgm.isPending
  const opts = { onSuccess: onClear }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-2xl border bg-popover p-1.5 pl-4 shadow-2xl transition-all duration-300',
        vids.length ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0',
      )}
    >
      <span className="mr-2 text-sm">
        已选 <span className="font-semibold text-primary tabular-nums">{vids.length}</span> 项
      </span>
      <Button size="sm" disabled={busy} onClick={() => select.mutate({ vids, selected: true }, opts)}>
        <SparklesIcon />
        精选
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => select.mutate({ vids, selected: false }, opts)}>
        <StarOffIcon />
        取消精选
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => retryDownload.mutate(vids, opts)}>
        <RotateCcwIcon />
        重新下载
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => retryUpload.mutate(vids, opts)}>
        <CloudUploadIcon />
        重试上传
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => resetBgm.mutate(vids, opts)}>
        <Music2Icon />
        重置 BGM
      </Button>
      <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
        <Trash2Icon />
        删除
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="取消选择" onClick={onClear}>
        <XIcon />
      </Button>
    </div>
  )
}

function PageNav({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  const pages = pageWindow(page, pageCount)
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (p >= 1 && p <= pageCount && p !== page) onChange(p)
  }

  return (
    <Pagination className="mx-0 ml-auto w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" text="上一页" onClick={go(page - 1)} aria-disabled={page <= 1} className={page <= 1 ? 'pointer-events-none opacity-50' : undefined} />
        </PaginationItem>
        {pages.map((p, i) =>
          p === null ? (
            <PaginationItem key={`e${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={go(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="下一页"
            onClick={go(page + 1)}
            aria-disabled={page >= pageCount}
            className={page >= pageCount ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(page - 2, count - 5))
  const end = Math.min(count - 1, Math.max(page + 2, 6))
  const pages: (number | null)[] = [1]
  if (start > 2) pages.push(null)
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < count - 1) pages.push(null)
  pages.push(count)
  return pages
}
