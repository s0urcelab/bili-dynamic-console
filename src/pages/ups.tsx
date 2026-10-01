import { useSearchParams } from 'react-router-dom'
import { UsersRoundIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState, EndOfList, ErrorState, LoadMoreSentinel } from '@/components/states'
import { useUpFeed } from '@/api/public'
import { UpResultCard } from '@/pages/explore'
import type { UpSort } from '@/types'

const SORTS: { value: UpSort; label: string }[] = [
  { value: 'recent', label: '最近更新' },
  { value: 'count', label: '稿件最多' },
]

export function UpsPage() {
  const [params, setParams] = useSearchParams()
  const sort: UpSort = params.get('sort') === 'count' ? 'count' : 'recent'
  const feed = useUpFeed(sort)
  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const total = feed.data?.pages[0]?.total

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <UsersRoundIcon className="size-5 text-primary" />
            全部 UP 主
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{total === undefined ? '加载中…' : `共 ${total.toLocaleString()} 位`}</p>
        </div>
        <Tabs value={sort} onValueChange={(v) => setParams(v === 'recent' ? {} : { sort: v }, { replace: true })}>
          <TabsList>
            {SORTS.map((s) => (
              <TabsTrigger key={s.value} value={s.value} className="px-3">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {feed.isError && !items.length ? (
        <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
      ) : !feed.isPending && !items.length ? (
        <EmptyState title="还没有 UP 主" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((up) => (
            <UpResultCard key={up.uid} up={up} />
          ))}
          {(feed.isPending || feed.isFetchingNextPage) && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[90px] rounded-xl" />)}
        </div>
      )}
      {feed.hasNextPage && <LoadMoreSentinel onVisible={() => !feed.isFetchingNextPage && feed.fetchNextPage()} disabled={feed.isFetchingNextPage} />}
      {!feed.isPending && !feed.hasNextPage && items.length > 0 && <EndOfList />}
    </div>
  )
}
