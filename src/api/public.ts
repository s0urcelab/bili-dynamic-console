import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { request } from '@/lib/api'
import type { Page, SearchResult, Up, Video, VideoDetail } from '@/types'

const PAGE_SIZE = 20

export function useVideoFeed(uid?: number | string) {
  return useInfiniteQuery({
    queryKey: ['videos', { uid }],
    queryFn: ({ pageParam }) => request<Page<Video>>('/videos', { params: { page: pageParam, size: PAGE_SIZE, uid } }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.size < last.total ? last.page + 1 : undefined),
  })
}

export function useSearch(keyword: string) {
  return useQuery({
    queryKey: ['search', keyword],
    queryFn: () => request<SearchResult>('/search', { params: { keyword } }),
    enabled: !!keyword,
    placeholderData: keepPreviousData,
  })
}

export function useUp(uid: string | undefined) {
  return useQuery({
    queryKey: ['ups', uid],
    queryFn: () => request<Up>(`/ups/${uid}`),
    enabled: !!uid,
  })
}

/** 关注的 UP 主列表，兼容数组或分页结构 */
export function useUps() {
  return useQuery({
    queryKey: ['ups'],
    queryFn: async () => {
      const data = await request<Up[] | Page<Up>>('/ups')
      return Array.isArray(data) ? data : data.items
    },
    staleTime: 10 * 60_000,
    retry: false,
  })
}

export function useVideoDetail(vid: string | undefined) {
  return useQuery({
    queryKey: ['video', vid],
    queryFn: () => request<VideoDetail>(`/videos/${encodeURIComponent(vid!)}`),
    enabled: !!vid,
  })
}
