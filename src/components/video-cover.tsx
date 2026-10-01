import { cn } from '@/lib/utils'
import { durationText } from '@/lib/format'
import { imgUrl, is4K, isAcfun, partOf } from '@/lib/video'
import type { Video } from '@/types'

export function VideoCover({ video, className, showBadges = true }: { video: Video; className?: string; showBadges?: boolean }) {
  const p = partOf(video)
  const cover = imgUrl(video.cover)
  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-pink-200 via-rose-100 to-sky-200 dark:from-pink-950 dark:via-neutral-900 dark:to-sky-950',
        className,
      )}
    >
      {video.is_portrait ? (
        <>
          <img src={cover} alt="" aria-hidden referrerPolicy="no-referrer" className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl" />
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="absolute inset-0 size-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </>
      ) : (
        <img
          src={cover}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      {showBadges && (
        <div className="absolute top-2 left-2 flex gap-1">
          {isAcfun(video) && <CoverTag className="bg-red-500/90">AcFun</CoverTag>}
          {p > 1 && <CoverTag className="bg-sky-500/90">P{p}</CoverTag>}
          {!!video.is_portrait && <CoverTag className="bg-violet-500/90">竖屏</CoverTag>}
        </div>
      )}
      <div className="absolute right-2 bottom-2 flex items-center gap-1">
        {showBadges && is4K(video) && <CoverTag className="bg-amber-500/90">4K</CoverTag>}
        <span className="rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-white tabular-nums">{durationText(video)}</span>
      </div>
    </div>
  )
}

function CoverTag({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur', className)}>{children}</span>
}
