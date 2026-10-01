import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRightIcon, SparklesIcon, UsersRoundIcon, XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EndOfList, ErrorState, LoadMoreSentinel } from '@/components/states'
import { VideoCard, VideoCardSkeletons, VideoGrid } from '@/components/video-card'
import { useSearch, useUps, useVideoFeed } from '@/api/public'
import { imgUrl } from '@/lib/video'
import type { Up } from '@/types'

export function ExplorePage() {
  const [params] = useSearchParams()
  const keyword = params.get('keyword')?.trim()

  if (keyword) return <SearchResult keyword={keyword} />

  return (
    <div className="space-y-8">
      <FollowedUps />
      <section className="space-y-5">
        <VideoFeed
          header={(total) => (
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <SparklesIcon className="size-5 text-primary" />
                最新精选
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{total === undefined ? '加载中…' : `共 ${total.toLocaleString()} 个稿件，按发布时间倒序`}</p>
            </div>
          )}
        />
      </section>
    </div>
  )
}

export function VideoFeed({ uid, hideUp, header }: { uid?: number | string; hideUp?: boolean; header?: (total: number | undefined) => React.ReactNode }) {
  const feed = useVideoFeed(uid)
  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const total = feed.data?.pages[0]?.total

  return (
    <>
      {header?.(total)}
      {feed.isError && !items.length ? (
        <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
      ) : !feed.isPending && !items.length ? (
        <EmptyState title="还没有稿件" />
      ) : (
        <VideoGrid>
          {items.map((v) => (
            <VideoCard key={v.vid} video={v} hideUp={hideUp} />
          ))}
          {(feed.isPending || feed.isFetchingNextPage) && <VideoCardSkeletons />}
        </VideoGrid>
      )}
      {feed.hasNextPage && <LoadMoreSentinel onVisible={() => !feed.isFetchingNextPage && feed.fetchNextPage()} disabled={feed.isFetchingNextPage} />}
      {!feed.isPending && !feed.hasNextPage && items.length > 0 && <EndOfList />}
    </>
  )
}

function FollowedUps() {
  const { data, isPending, isError } = useUps()
  const ups = data?.items
  if (isError || (!isPending && !ups?.length)) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <UsersRoundIcon className="size-4" />
          最近更新的 UP 主
        </h2>
        {data && (
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link to="/ups">
              全部 {data.total.toLocaleString()} 位
              <ChevronRightIcon />
            </Link>
          </Button>
        )}
      </div>
      <div className="relative">
        <div className="flex gap-5 overflow-hidden py-1">
          {isPending
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <Skeleton className="size-14 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))
            : ups!.map((up) => (
                <Link key={up.uid} to={`/u/${up.uid}`} className="group flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <Avatar className="size-14 ring-2 ring-transparent ring-offset-2 ring-offset-background transition group-hover:ring-primary">
                    <AvatarImage src={imgUrl(up.avatar)} referrerPolicy="no-referrer" />
                    <AvatarFallback>{up.uname.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="w-full truncate text-center text-xs text-muted-foreground group-hover:text-foreground">{up.uname}</span>
                </Link>
              ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  )
}

function SearchResult({ keyword }: { keyword: string }) {
  const { data, isPending, isError, error, refetch } = useSearch(keyword)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          “<span className="text-primary">{keyword}</span>” 的搜索结果
        </h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <XIcon />
            清除
          </Link>
        </Button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          {!!data?.ups.length && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">UP 主 · {data.ups.length}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.ups.map((up) => (
                  <UpResultCard key={up.uid} up={up} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">稿件{data ? ` · ${data.videos.length}` : ''}</h2>
            {data && !data.videos.length ? (
              <EmptyState title="没有找到相关稿件" description="换个关键词试试" />
            ) : (
              <VideoGrid>{isPending ? <VideoCardSkeletons count={10} /> : data!.videos.map((v) => <VideoCard key={v.vid} video={v} />)}</VideoGrid>
            )}
            {data && data.videos.length >= 50 && <EndOfList text="最多显示 50 个结果，请尝试更精确的关键词" />}
          </section>
        </>
      )}
    </div>
  )
}

export function UpResultCard({ up }: { up: Up }) {
  return (
    <Link to={`/u/${up.uid}`} className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent">
      <Avatar className="size-14">
        <AvatarImage src={imgUrl(up.avatar)} referrerPolicy="no-referrer" />
        <AvatarFallback>{up.uname.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium group-hover:text-primary">{up.uname}</p>
        {up.video_count !== undefined && <p className="text-xs text-muted-foreground">{up.video_count} 个稿件</p>}
        <p className="mt-1 truncate text-xs text-muted-foreground">{up.sign || '这个人很懒，什么都没写'}</p>
      </div>
    </Link>
  )
}
