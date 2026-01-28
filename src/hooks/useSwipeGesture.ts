import { useRef, useCallback, TouchEvent } from "react";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeConfig): SwipeHandlers {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(distance) > threshold) {
      if (distance > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (distance < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    isSwiping.current = false;
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
