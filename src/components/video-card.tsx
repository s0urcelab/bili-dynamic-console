import { Link } from 'react-router-dom'
import { Music2Icon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { VideoCover } from '@/components/video-cover'
import { fromNow } from '@/lib/format'
import { imgUrl, upOf, videoPath } from '@/lib/video'
import type { Video } from '@/types'

export function VideoCard({ video, hideUp = false }: { video: Video; hideUp?: boolean }) {
  const up = upOf(video)
  const href = videoPath(video.vid)
  return (
    <div className="group flex flex-col gap-3">
      <Link to={href} className="block">
        <VideoCover video={video} className="shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-lg dark:ring-white/10" />
      </Link>
      <div className="flex gap-3">
        {!hideUp && (
          <Link to={`/u/${up.uid}`} className="shrink-0">
            <Avatar className="size-9">
              <AvatarImage src={imgUrl(up.avatar)} referrerPolicy="no-referrer" />
              <AvatarFallback>{up.uname.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </Link>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <Link to={href} className="line-clamp-2 text-sm leading-snug font-medium transition-colors group-hover:text-primary">
            {video.title}
          </Link>
          {video.bgm_title && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Music2Icon className="size-3 shrink-0" />
              <span className="truncate">{video.bgm_title}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {!hideUp && (
              <>
                <Link to={`/u/${up.uid}`} className="truncate hover:text-foreground">
                  {up.uname}
                </Link>
                <span>·</span>
              </>
            )}
            <span className="shrink-0">{fromNow(video.pdate)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function VideoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{children}</div>
}

export function VideoCardSkeletons({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
