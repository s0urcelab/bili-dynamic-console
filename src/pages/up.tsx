import { useParams } from 'react-router-dom'
import { ExternalLinkIcon, FilmIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states'
import { useUp } from '@/api/public'
import { ApiError } from '@/lib/api'
import { imgUrl, upSpaceLink } from '@/lib/video'
import { VideoFeed } from '@/pages/explore'
import { NotFoundPage } from '@/pages/not-found'

export function UpPage() {
  const { uid } = useParams()
  const { data: up, isPending, isError, error, refetch } = useUp(uid)

  if (error instanceof ApiError && error.status === 404) return <NotFoundPage title="UP 主不存在" />

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border">
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-pink-300 via-rose-200 to-sky-300 md:h-44 dark:from-pink-900 dark:via-rose-950 dark:to-sky-900">
          {up?.avatar && <img src={imgUrl(up.avatar)} alt="" referrerPolicy="no-referrer" className="size-full scale-150 object-cover opacity-40 blur-3xl" />}
        </div>
        <div className="flex flex-col gap-4 bg-card px-6 pb-6 md:flex-row md:items-end md:px-8">
          <Avatar className="-mt-12 size-24 border-4 border-card shadow-lg md:size-28">
            <AvatarImage src={imgUrl(up?.avatar)} referrerPolicy="no-referrer" />
            <AvatarFallback className="text-2xl">{up?.uname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            {isPending ? (
              <>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : isError ? (
              <ErrorState error={error} onRetry={() => refetch()} className="items-start py-2" />
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">{up.uname}</h1>
                <p className="text-sm text-muted-foreground">{up.sign || '这个人很懒，什么都没写'}</p>
                <p className="flex items-center gap-4 pt-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <FilmIcon className="size-4 text-primary" />
                    <span className="font-semibold tabular-nums">{up.video_count ?? 0}</span>
                    <span className="text-muted-foreground">个精选稿件</span>
                  </span>
                  <span className="text-muted-foreground">UID {up.uid}</span>
                </p>
              </>
            )}
          </div>
          <Button asChild className="rounded-full">
            <a href={upSpaceLink(Number(uid))} target="_blank" rel="noreferrer">
              B 站个人空间
              <ExternalLinkIcon />
            </a>
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <VideoFeed uid={uid} hideUp header={() => <h2 className="text-lg font-semibold">全部稿件</h2>} />
      </section>
    </div>
  )
}
