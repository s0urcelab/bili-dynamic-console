import { useState, type ReactNode } from 'react'
import { LinkIcon, Loader2Icon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useImportVideo } from '@/api/admin'

function parseLink(link: string) {
  const bv = link.match(/(BV[A-Za-z0-9]{10})(?:.*[?&]p=(\d+))?/)
  if (bv) return { source: 'bilibili' as const, vid: bv[1], p: Number(bv[2] ?? 1) }
  const ac = link.match(/(ac\d+)(?:_(\d+))?/i)
  if (ac) return { source: 'acfun' as const, vid: ac[1].toLowerCase(), p: Number(ac[2] ?? 1) }
  return null
}

/** 手动导入稿件弹窗；传入 trigger 可使用自定义入口，默认渲染「导入稿件」按钮 */
export function ImportDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [p, setP] = useState('')
  const parsed = parseLink(link.trim())
  const importVideo = useImportVideo()

  const close = () => {
    setOpen(false)
    setLink('')
    setP('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            导入稿件
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            if (!parsed) return
            importVideo.mutate({ source: parsed.source, vid: parsed.vid, p: Number(p) || parsed.p }, { onSuccess: close })
          }}
        >
          <DialogHeader>
            <DialogTitle>手动导入稿件</DialogTitle>
            <DialogDescription>支持 B 站和 AcFun 链接，导入后自动精选。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-link">视频链接或 BV / ac 号</Label>
              <div className="relative">
                <LinkIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="import-link" autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.bilibili.com/video/BV1..." className="pl-9" />
              </div>
            </div>
            {link.trim() && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                {parsed ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={parsed.source === 'acfun' ? 'destructive' : 'default'}>{parsed.source === 'acfun' ? 'AcFun' : 'bilibili'}</Badge>
                    <code className="font-mono">{parsed.vid}</code>
                    <span className="text-muted-foreground">· P{Number(p) || parsed.p}</span>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-destructive">
                    <TriangleAlertIcon className="size-4" />
                    无法识别链接
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="import-p">分 P（可选，默认取链接中的分 P）</Label>
              <Input id="import-p" type="number" min={1} value={p} onChange={(e) => setP(e.target.value)} placeholder={String(parsed?.p ?? 1)} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!parsed || importVideo.isPending}>
              {importVideo.isPending && <Loader2Icon className="animate-spin" />}
              导入
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
