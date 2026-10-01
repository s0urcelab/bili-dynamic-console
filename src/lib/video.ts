import type { Up, Video } from '@/types'

export const isAcfun = (v: Video) => v.source === 3

/** B 站返回的图片可能是 http 地址，在 https 页面下会被拦截 */
export function imgUrl(url: string | null | undefined) {
  if (!url) return undefined
  return url.replace(/^http:\/\//, 'https://').replace(/^\/\//, 'https://')
}

export const is4K = (v: Video) => /4K/i.test(v.max_quality ?? '')

/** 优先取关注列表中的最新 UP 主信息 */
export function upOf(v: Video): Up {
  return v.up ?? { uid: v.uid, uname: v.uname, avatar: v.avatar }
}

export function partOf(v: Video) {
  if (v.p) return v.p
  const m = v.vid.match(/\[p(\d+)\]$/)
  return m ? Number(m[1]) : 1
}

export function sourceLink(v: Video) {
  const pureVid = v.pure_vid || v.vid.replace(/\[p\d+\]$/, '')
  const p = partOf(v)
  if (isAcfun(v)) return `https://www.acfun.cn/v/${pureVid}${p > 1 ? `_${p}` : ''}`
  return `https://www.bilibili.com/video/${pureVid}${p > 1 ? `?p=${p}` : ''}`
}

export function upSpaceLink(uid: number) {
  return `https://space.bilibili.com/${uid}/video`
}

export const canPreview = (v: Video) => v.dstatus >= 200 || v.dstatus === -3

/** shazam_id：0 待识别，-1 无匹配，-2 无本地文件，-3 识别出错，其他为曲目 id */
export function bgmState(v: Video): 'recognized' | 'manual' | 'pending' | 'no_match' | 'no_file' | 'error' {
  const id = v.shazam_id
  if (id === 0 || id === '0' || id === null || id === undefined) return v.etitle ? 'manual' : 'pending'
  if (id === -1) return v.etitle ? 'manual' : 'no_match'
  if (id === -2) return v.etitle ? 'manual' : 'no_file'
  if (id === -3) return v.etitle ? 'manual' : 'error'
  return 'recognized'
}

export function videoPath(vid: string) {
  return `/v/${encodeURIComponent(vid)}`
}
