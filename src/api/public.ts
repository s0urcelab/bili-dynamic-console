import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { request } from '@/lib/api'
import type { Page, SearchResult, Up, UpSort, Video, VideoDetail } from '@/types'

const PAGE_SIZE = 20
const UP_PAGE_SIZE = 48

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

/** 有已发布稿件的 UP 主，只取第一页 */
export function useUps({ size = 20, sort = 'recent' }: { size?: number; sort?: UpSort } = {}) {
  return useQuery({
    queryKey: ['ups', 'list', { size, sort }],
    queryFn: () => request<Page<Up>>('/ups', { params: { page: 1, size, sort } }),
    staleTime: 10 * 60_000,
    retry: false,
  })
}

export function useUpFeed(sort: UpSort) {
  return useInfiniteQuery({
    queryKey: ['ups', 'feed', { sort }],
    queryFn: ({ pageParam }) => request<Page<Up>>('/ups', { params: { page: pageParam, size: UP_PAGE_SIZE, sort } }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.size < last.total ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  })
}

export function useVideoDetail(vid: string | undefined) {
  return useQuery({
    queryKey: ['video', vid],
    queryFn: () => request<VideoDetail>(`/videos/${encodeURIComponent(vid!)}`),
    enabled: !!vid,
  })
}
