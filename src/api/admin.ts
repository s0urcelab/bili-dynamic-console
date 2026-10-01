import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { request, requestEnvelope } from '@/lib/api'
import { useApiMutation } from '@/api/mutation'
import type { AdminVideoFilter, AdminVideosPage, Checkpoint, CookieInfo, CookieKind, Stats, Storage, Task, TaskName, TasksResponse, Versions } from '@/types'

export const adminKeys = {
  videos: ['admin', 'videos'] as const,
  stats: ['admin', 'stats'] as const,
  storage: ['admin', 'storage'] as const,
  tasks: ['admin', 'tasks'] as const,
  cookies: ['admin', 'cookies'] as const,
  checkpoint: ['admin', 'checkpoint'] as const,
  versions: ['admin', 'versions'] as const,
}

export type AdminVideosParams = {
  page: number
  size: number
  filter?: AdminVideoFilter
  uid?: string | null
  keyword?: string | null
}

export function useAdminVideos(params: AdminVideosParams) {
  return useQuery({
    queryKey: [...adminKeys.videos, params],
    queryFn: () => request<AdminVideosPage>('/admin/videos', { params: { ...params, filter: params.filter === 'all' ? undefined : params.filter } }),
    placeholderData: keepPreviousData,
  })
}

/** 借助稿件搜索接口返回的 ups 字段搜索 UP 主 */
export function useUpSearch(keyword: string) {
  return useQuery({
    queryKey: [...adminKeys.videos, 'ups', keyword],
    queryFn: async () => (await request<AdminVideosPage>('/admin/videos', { params: { keyword, page: 1, size: 1 } })).ups ?? [],
    enabled: !!keyword,
    placeholderData: keepPreviousData,
  })
}

export function useStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: () => request<Stats>('/admin/stats') })
}

export function useStorage() {
  return useQuery({ queryKey: adminKeys.storage, queryFn: () => request<Storage>('/admin/storage'), staleTime: 5 * 60_000 })
}

export function useTasks() {
  return useQuery({
    queryKey: adminKeys.tasks,
    queryFn: () => request<TasksResponse>('/admin/tasks'),
    refetchInterval: 10_000,
  })
}

export function useCookies() {
  return useQuery({ queryKey: adminKeys.cookies, queryFn: () => request<Record<CookieKind, CookieInfo>>('/admin/cookies') })
}

export function useCheckpoint() {
  return useQuery({ queryKey: adminKeys.checkpoint, queryFn: () => request<Checkpoint>('/admin/checkpoint') })
}

export function useVersions() {
  return useQuery({ queryKey: adminKeys.versions, queryFn: () => request<Versions>('/admin/versions'), staleTime: Infinity })
}

const videoDataKeys = [adminKeys.videos, adminKeys.stats, ['videos'], ['video'], ['search']]

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body })

// ---------- 稿件 ----------

export function useImportVideo() {
  return useApiMutation({
    fn: (body: { source: 'bilibili' | 'acfun'; vid: string; p?: number }) => post<{ vid: string }>('/admin/videos/import', body),
    success: (d) => `已导入 ${d.vid}`,
    invalidate: videoDataKeys,
  })
}

export function useSelectVideos() {
  return useApiMutation({
    fn: ({ vids, selected }: { vids: string[]; selected: boolean }) => post<{ modified: number }>('/admin/videos/select', { vids, selected }),
    success: (d, v) => `已${v.selected ? '精选' : '取消精选'} ${d.modified} 个稿件`,
    invalidate: videoDataKeys,
  })
}

export function useRetryDownload() {
  return useApiMutation({
    fn: (vids: string[]) => post<{ queued: number }>('/admin/videos/retry-download', { vids }),
    success: (d) => `已加入下载队列 ${d.queued} 个`,
    invalidate: videoDataKeys,
  })
}

export function useRetryUpload() {
  return useApiMutation({
    fn: (vids: string[]) => post<{ modified: number }>('/admin/videos/retry-upload', { vids }),
    success: (d) => `已重置上传 ${d.modified} 个`,
    invalidate: [adminKeys.videos, adminKeys.stats],
  })
}

export function useResetBgm() {
  return useApiMutation({
    fn: (vids: string[]) => post<{ modified: number }>('/admin/videos/reset-bgm', { vids }),
    success: (d) => `已重置 BGM 识别 ${d.modified} 个`,
    invalidate: [adminKeys.videos, adminKeys.stats],
  })
}

export function useDeleteVideos(onSuccess?: () => void) {
  return useApiMutation({
    fn: (vids: string[]) => post<{ deleted: number }>('/admin/videos/delete', { vids }),
    success: (d) => `已删除 ${d.deleted} 个稿件`,
    invalidate: videoDataKeys,
    onSuccess,
  })
}

export function useDeleteRange() {
  return useApiMutation({
    fn: (body: { start: number; end: number; uid?: number }) => post<{ deleted: number }>('/admin/videos/delete-range', body),
    success: (d) => `已删除 ${d.deleted} 个稿件`,
    invalidate: videoDataKeys,
  })
}

export function useSetOwner() {
  return useApiMutation({
    fn: ({ vid, uid, uname }: { vid: string; uid: number; uname: string }) =>
      request(`/admin/videos/${encodeURIComponent(vid)}/owner`, { method: 'PUT', body: { uid, uname } }),
    success: (_, v) => `已改为 ${v.uname}`,
    invalidate: videoDataKeys,
  })
}

export function useSetBgmTitle() {
  return useApiMutation({
    fn: ({ vid, title }: { vid: string; title: string }) =>
      request<{ scope: 'song' | 'video' }>(`/admin/videos/${encodeURIComponent(vid)}/bgm-title`, { method: 'PUT', body: { title } }),
    success: (d) => (d.scope === 'song' ? '已修改曲目标题，所有使用该曲目的稿件都会变化' : '已修改 BGM 标题'),
    invalidate: [adminKeys.videos],
  })
}

// ---------- 任务 ----------

export function useToggleTask() {
  return useApiMutation({
    fn: ({ name, enabled }: { name: TaskName; enabled: boolean }) => request<Task>(`/admin/tasks/${name}`, { method: 'PATCH', body: { enabled } }),
    success: (d) => `${d.label}已${d.enabled ? '开启' : '关闭'}`,
    invalidate: [adminKeys.tasks],
  })
}

export function useRunTask() {
  return useApiMutation({
    fn: (name: TaskName) => request(`/admin/tasks/${name}/run`, { method: 'POST' }),
    success: () => '已请求执行，worker 将在 10 秒内开始',
    invalidate: [adminKeys.tasks],
  })
}

// ---------- Cookie ----------

function notifyCookie(info: CookieInfo, message: string) {
  const text = info.download_resumed ? `${message}，下载已自动恢复` : message
  if (info.last_check?.logged_in) toast.success(text)
  else toast.warning(text)
}

export function useSaveCookie() {
  return useApiMutation({
    fn: ({ kind, content }: { kind: CookieKind; content: string }) =>
      requestEnvelope<CookieInfo>(`/admin/cookies/${kind}`, { method: 'PUT', body: { content } }),
    onSuccess: (env) => notifyCookie(env.data, env.message),
    invalidate: [adminKeys.cookies, adminKeys.tasks],
  })
}

export function useCheckCookie() {
  return useApiMutation({
    fn: (kind: CookieKind) => request<CookieInfo>(`/admin/cookies/${kind}/check`, { method: 'POST' }),
    onSuccess: (info) => {
      const c = info.last_check
      notifyCookie(info, c?.logged_in ? `已登录：${c.uname}` : c?.logged_in === false ? '未登录或已失效' : `检测失败：${c?.error ?? '网络错误'}`)
    },
    invalidate: [adminKeys.cookies, adminKeys.tasks],
  })
}

export function useDeleteCookie() {
  return useApiMutation({
    fn: (kind: CookieKind) => request<CookieInfo>(`/admin/cookies/${kind}`, { method: 'DELETE' }),
    success: (d) => `已清除后台配置的${d.label}`,
    invalidate: [adminKeys.cookies],
  })
}

// ---------- 系统 ----------

export function useSetCheckpoint() {
  return useApiMutation({
    fn: (timestamp: number) => request<Checkpoint>('/admin/checkpoint', { method: 'PUT', body: { timestamp } }),
    success: (d) => `截止时间已更新为 ${d.datetime}`,
    invalidate: [adminKeys.checkpoint],
  })
}
