import { useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/api'
import { useApiMutation } from '@/api/mutation'

export const meKey = ['auth', 'me'] as const

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: () => request<{ logged_in: boolean }>('/auth/me'),
    staleTime: 5 * 60_000,
  })
}

export function useIsAdmin() {
  return useMe().data?.logged_in === true
}

export function useLogin() {
  const qc = useQueryClient()
  return useApiMutation({
    fn: (password: string) => request<{ logged_in: boolean }>('/auth/login', { method: 'POST', body: { password } }),
    success: () => '登录成功',
    onSuccess: () => qc.setQueryData(meKey, { logged_in: true }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useApiMutation({
    fn: () => request('/auth/logout', { method: 'POST' }),
    success: () => '已退出登录',
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['admin'] })
      qc.setQueryData(meKey, { logged_in: false })
    },
  })
}
