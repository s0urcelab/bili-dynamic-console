import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

type Options<TVars, TData> = {
  fn: (vars: TVars) => Promise<TData>
  /** 返回成功提示文案；返回空则不提示 */
  success?: (data: TData, vars: TVars) => string | null | undefined
  invalidate?: QueryKey[]
  onSuccess?: (data: TData, vars: TVars) => void
}

/** 统一处理成功提示、失败提示和缓存失效的 mutation */
export function useApiMutation<TVars = void, TData = unknown>({ fn, success, invalidate, onSuccess }: Options<TVars, TData>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data, vars) => {
      const msg = success?.(data, vars)
      if (msg) toast.success(msg)
      onSuccess?.(data, vars)
      await Promise.all((invalidate ?? []).map((queryKey) => qc.invalidateQueries({ queryKey })))
    },
  })
}
