const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Envelope<T> = { code: number; message: string; data: T }

type Params = Record<string, string | number | boolean | null | undefined>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Params
  body?: unknown
}

export async function requestEnvelope<T>(path: string, { method = 'GET', params, body }: RequestOptions = {}): Promise<Envelope<T>> {
  const url = new URL(BASE + path, window.location.origin)
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, '网络错误，无法连接服务器')
  }

  let payload: Envelope<T> | null = null
  try {
    payload = await res.json()
  } catch {
    // 非 JSON 响应（如网关错误页）按 HTTP 状态处理
  }
  if (!res.ok || !payload || payload.code !== 0) {
    throw new ApiError(payload?.code || res.status, payload?.message || `请求失败（${res.status}）`)
  }
  return payload
}

export async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  return (await requestEnvelope<T>(path, options)).data
}
