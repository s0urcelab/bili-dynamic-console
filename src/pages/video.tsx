import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarIcon, ExternalLinkIcon, GaugeIcon, Music2Icon, ShareIcon, SparklesIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorState } from '@/components/states'
import { VideoCover } from '@/components/video-cover'
import { VideoPlayer } from '@/components/video-player'
import { useIsAdmin } from '@/api/auth'
import { useDeleteVideos } from '@/api/admin'
import { useVideoDetail } from '@/api/public'
import { ApiError } from '@/lib/api'
import { fromNow } from '@/lib/format'
import { imgUrl, isAcfun, sourceLink, upOf, videoPath } from '@/lib/video'
import { NotFoundPage } from '@/pages/not-found'

export function VideoPage() {
  const { vid } = useParams()
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const { data, isPending, isError, error, refetch } = useVideoDetail(vid)
  const del = useDeleteVideos(() => navigate(-1))

  if (error instanceof ApiError && error.status === 404) return <NotFoundPage title="稿件不存在或尚未发布" />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  const video = data?.video
  const up = video && upOf(video)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-black shadow-xl">
          {isPending ? (
            <Skeleton className="aspect-video rounded-none" />
          ) : data!.play_url ? (
            <VideoPlayer src={data!.play_url} poster={imgUrl(video!.cover)} autoplay />
          ) : (
            <div className="relative grid aspect-video place-items-center">
              <img src={imgUrl(video!.cover)} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-contain opacity-30" />
              <p className="relative flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
                <TriangleAlertIcon className="size-4 text-warning" />
                {data!.play_error || '暂时无法播放'}
              </p>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{video!.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-4" />
                  {video!.pdstr}
                </span>
                {video!.max_quality && (
                  <span className="flex items-center gap-1.5">
                    <GaugeIcon className="size-4" />
                    {video!.max_quality}
                  </span>
                )}
                {video!.selected && (
                  <Badge className="gap-1">
                    <SparklesIcon />
                    精选
                  </Badge>
                )}
                {isAcfun(video!) && <Badge variant="outline">AcFun</Badge>}
                {!!video!.is_portrait && <Badge variant="outline">竖屏</Badge>}
              </div>
              {video!.bgm_title && (
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 py-1 pr-3 pl-1 text-sm">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                    <Music2Icon className="size-3.5" />
                  </span>
                  <span className="text-muted-foreground">BGM</span>
                  <span className="font-medium">{video!.bgm_title}</span>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to={`/u/${up!.uid}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={imgUrl(up!.avatar)} referrerPolicy="no-referrer" />
                    <AvatarFallback>{up!.uname.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium hover:text-primary">{up!.uname}</p>
                    <p className="truncate text-sm text-muted-foreground">{up!.sign || '这个人很懒，什么都没写'}</p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={sourceLink(video!)} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                      原稿件
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="复制链接"
                    onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('链接已复制'))}
                  >
                    <ShareIcon />
                  </Button>
                  {isAdmin && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="icon" aria-label="删除" disabled={del.isPending}>
                          <Trash2Icon />
                        </Button>
                      }
                      title="彻底删除这个稿件？"
                      description="会同时删除稿件记录，以及本地和云盘上的视频、封面，不可撤销。"
                      confirmText="删除"
                      onConfirm={() => del.mutate([video!.vid])}
                    />
                  )}
                </div>
              </CardContent>
              {video!.desc && (
                <>
                  <Separator />
                  <CardContent>
                    <p className="text-sm whitespace-pre-line text-muted-foreground">{video!.desc}</p>
                  </CardContent>
                </>
              )}
            </Card>
          </>
        )}
      </div>

      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">TA 的更多稿件</h2>
          {up && (
            <Button variant="link" size="sm" asChild className="px-0">
              <Link to={`/u/${up.uid}`}>查看全部</Link>
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-1.5">
                  <Skeleton className="aspect-video w-40 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : data!.related.map((v) => (
                <Link key={v.vid} to={videoPath(v.vid)} className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-accent">
                  <VideoCover video={v} showBadges={false} className="w-40 shrink-0 rounded-lg" />
                  <div className="min-w-0 space-y-1 py-0.5">
                    <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{fromNow(v.pdate)}</p>
                  </div>
                </Link>
              ))}
          {data && !data.related.length && <p className="py-6 text-center text-sm text-muted-foreground">暂无其他稿件</p>}
        </div>
      </aside>
    </div>
  )
}
