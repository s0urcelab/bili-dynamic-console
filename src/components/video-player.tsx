import { useEffect, useRef } from 'react'
import Plyr from 'plyr'
import { cn } from '@/lib/utils'

type Props = {
  src: string
  poster?: string
  autoplay?: boolean
  className?: string
}

/** Plyr 会改写 DOM（destroy 时还会替换 video 节点），所以 video 元素由 effect 自行创建，不交给 React 管理 */
export function VideoPlayer({ src, poster, autoplay = false, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current!
    const video = document.createElement('video')
    video.src = src
    if (poster) video.poster = poster
    video.playsInline = true
    video.preload = 'metadata'
    container.appendChild(video)

    const player = new Plyr(video, {
      autoplay,
      ratio: '16:9',
      i18n: PLYR_ZH,
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
      settings: ['speed', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      keyboard: { focused: true, global: true },
    })
    return () => {
      player.destroy()
      container.replaceChildren()
    }
  }, [src, poster, autoplay])

  return <div ref={containerRef} className={cn('plyr-wrapper overflow-hidden bg-black', className)} />
}

const PLYR_ZH = {
  restart: '重新播放',
  rewind: '快退 {seektime} 秒',
  play: '播放',
  pause: '暂停',
  fastForward: '快进 {seektime} 秒',
  seek: '跳转',
  seekLabel: '{currentTime} / {duration}',
  played: '已播放',
  buffered: '已缓冲',
  currentTime: '当前时间',
  duration: '时长',
  volume: '音量',
  mute: '静音',
  unmute: '取消静音',
  enableCaptions: '开启字幕',
  disableCaptions: '关闭字幕',
  enterFullscreen: '全屏',
  exitFullscreen: '退出全屏',
  frameTitle: '{title}',
  captions: '字幕',
  settings: '设置',
  pip: '画中画',
  menuBack: '返回',
  speed: '倍速',
  normal: '正常',
  quality: '画质',
  loop: '循环播放',
  start: '开始',
  end: '结束',
  all: '全部',
  reset: '重置',
  disabled: '关闭',
  enabled: '开启',
}
