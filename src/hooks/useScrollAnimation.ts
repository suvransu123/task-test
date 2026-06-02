import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * useScrollAnimation
 *
 * Hook that observes an element and returns whether it's in the viewport.
 * Uses IntersectionObserver for performant scroll detection without scroll listeners.
 *
 * @param options.threshold - 0 to 1, how much of the element must be visible (default: 0.15)
 * @param options.rootMargin - CSS margin syntax for the observer root (default: '0px')
 * @param options.triggerOnce - if true, stops observing after first trigger (default: true)
 */
export const useScrollAnimation = <T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
) => {
  const { threshold = 0.15, rootMargin = '0px', triggerOnce = true } = options

  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (triggerOnce) {
              observer.unobserve(element)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

/**
 * useStaggeredAnimation
 *
 * Hook that provides staggered animation values for lists.
 * Returns an index-based delay multiplier.
 *
 * @param baseDelay - base delay in ms (default: 100)
 * @param increment - delay increment per item in ms (default: 80)
 */
export const useStaggeredAnimation = (
  itemIndex: number,
  baseDelay: number = 100,
  increment: number = 80,
) => {
  return baseDelay + itemIndex * increment
}