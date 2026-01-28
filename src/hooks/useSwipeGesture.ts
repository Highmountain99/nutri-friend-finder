import { useRef, useCallback, type TouchEvent } from "react";

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

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    const distance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(distance) > threshold) {
      if (distance > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (distance < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
