export type Page<T> = {
  items: T[]
  total: number
  page: number
  size: number
}

export type Up = {
  uid: number
  uname: string
  avatar: string
  sign?: string
  video_count?: number
  /** 最新已发布稿件的发布时间（秒级时间戳） */
  latest_at?: number
}

export type UpSort = 'recent' | 'count'

export type Video = {
  vid: string
  pure_vid?: string
  p?: number
  source: number | string
  title: string
  desc?: string
  cover: string
  uid: number
  uname: string
  avatar: string
  pdate: number
  pdstr: string
  duration: number
  duration_text?: string
  max_quality?: string
  is_portrait?: number
  ustatus: number
  dstatus: number
  dl_retry?: number
  dl_error?: string | null
  cloud_retry?: number
  cloud_error?: string | null
  fid?: string | null
  dl_requested?: boolean
  shazam_id?: number | string | null
  etitle?: string | null
  video_info?: { width: number; height: number; bitrate: number; fps: number } | null
  low_res?: boolean
  downloaded_at?: string | null
  uploaded_at?: string | null
  bgm_title?: string | null
  up?: Up | null
  selected: boolean
  dstatus_label: string
}

export type VideoDetail = {
  video: Video
  play_url: string | null
  play_error: string | null
  related: Video[]
}

export type SearchResult = {
  ups: Up[]
  videos: Video[]
}

export type AdminVideoFilter = 'all' | 'pending' | 'local' | 'archived' | 'download_failed' | 'upload_failed' | 'selected' | 'low_res'

export type AdminVideosPage = Page<Video> & { ups?: Up[] }

export type TaskName = 'fetch' | 'download' | 'upload' | 'match'

export type Task = {
  name: TaskName
  label: string
  enabled: boolean
  paused_reason: string | null
  running: boolean
  run_requested: boolean
  last_started_at: string | null
  last_finished_at: string | null
  last_status: 'ok' | 'failed' | 'timeout' | null
  last_summary: string | null
  last_error: string | null
  last_error_item: string | null
  last_error_at: string | null
  consecutive_failures: number
  interval_minutes: number
  timeout_minutes: number
}

export type TasksResponse = {
  worker: { online: boolean; heartbeat_at: string | null }
  tasks: Task[]
}

export type CookieKind = 'subscribe' | 'download'

export type CookieInfo = {
  kind: CookieKind
  label: string
  configured: boolean
  source: 'admin' | 'env' | null
  format: 'sessdata' | 'header' | 'netscape' | null
  names: string[]
  domains: string[]
  expires_at: string | null
  updated_at: string | null
  last_check: {
    checked_at: string
    logged_in: boolean | null
    uid: number | null
    uname: string | null
    vip: boolean
    error: string | null
  } | null
  error: string | null
  download_resumed?: boolean
}

export type Checkpoint = { timestamp: number; datetime: string }

export type Storage = {
  local_bytes: number
  cloud: { used_bytes: number | null; total_bytes: number | null; error: string | null }
}

export type Stats = {
  total: number
  by_dstatus: { dstatus: number; label: string; count: number }[]
  selected: number
  waiting_upload: number
  waiting_match: number
}
