import type { Video } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')

export function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function durationText(video: Pick<Video, 'duration' | 'duration_text'>) {
  return video.duration_text || formatDuration(video.duration || 0)
}

export function formatDate(ms: number, withYear = true) {
  const d = new Date(ms)
  const date = `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return withYear ? `${d.getFullYear()}-${date}` : date
}

/** 秒级时间戳转相对时间 */
export function fromNow(ts: number) {
  return relativeMs(ts * 1000)
}

export function relativeMs(ms: number) {
  const diff = Math.floor((Date.now() - ms) / 1000)
  if (diff < 60) return `${Math.max(diff, 0)} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(ms).slice(0, 10)
}

/** ISO 时间转 `MM-DD HH:mm`，跨年时带年份 */
export function timeOf(iso: string | null | undefined) {
  if (!iso) return '—'
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return iso
  return formatDate(ms, new Date(ms).getFullYear() !== new Date().getFullYear())
}

/** `YYYY-MM-DDTHH:mm`，用于 datetime-local 输入框 */
export function toDatetimeLocal(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
