import { useCallback, useEffect, useRef, type RefObject } from "react"

type UseAutoScrollOptions = {
  containerRef: RefObject<HTMLDivElement | null>
  messagesScrollKey: string
  isRunning: boolean
  resetKey: number
}

/**
 * 聊天面板自动滚动：
 * - 消息或流式内容变化时，跟随到底部；
 * - 用户滚轮、触摸或拖动滚动条后暂停跟随；
 * - 下一次发送消息时通过 resetKey 恢复跟随。
 */
export function useAutoScroll({
  containerRef,
  messagesScrollKey,
  isRunning,
  resetKey,
}: UseAutoScrollOptions) {
  const shouldFollowRef = useRef(true)
  const programmaticScrollRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    programmaticScrollRef.current = true
    container.scrollTop = container.scrollHeight
    window.requestAnimationFrame(() => {
      programmaticScrollRef.current = false
    })
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const pauseFollowing = () => {
      if (!programmaticScrollRef.current) shouldFollowRef.current = false
    }

    container.addEventListener("wheel", pauseFollowing, { passive: true })
    container.addEventListener("touchstart", pauseFollowing, { passive: true })
    container.addEventListener("pointerdown", pauseFollowing, { passive: true })

    return () => {
      container.removeEventListener("wheel", pauseFollowing)
      container.removeEventListener("touchstart", pauseFollowing)
      container.removeEventListener("pointerdown", pauseFollowing)
    }
  }, [containerRef])

  useEffect(() => {
    shouldFollowRef.current = true
    scrollToBottom()
  }, [resetKey, scrollToBottom])

  useEffect(() => {
    if (isRunning && shouldFollowRef.current) scrollToBottom()
  }, [isRunning, scrollToBottom])

  useEffect(() => {
    if (shouldFollowRef.current) scrollToBottom()
  }, [messagesScrollKey, scrollToBottom])
}
