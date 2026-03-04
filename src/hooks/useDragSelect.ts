import { useRef, useState, useCallback } from "react";

interface DragSelectOptions {
  onSelectionComplete?: (selectedIds: string[]) => void;
}

export function useDragSelect({ onSelectionComplete }: DragSelectOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelected, setDragSelected] = useState<Set<string>>(new Set());
  const startIdRef = useRef<string | null>(null);
  const allIdsRef = useRef<string[]>([]);

  const setSelectableIds = useCallback((ids: string[]) => {
    allIdsRef.current = ids;
  }, []);

  const getRange = useCallback((startId: string, endId: string): string[] => {
    const ids = allIdsRef.current;
    const startIdx = ids.indexOf(startId);
    const endIdx = ids.indexOf(endId);
    if (startIdx === -1 || endIdx === -1) return [];
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    return ids.slice(min, max + 1);
  }, []);

  const handlePointerDown = useCallback((id: string) => {
    setIsDragging(true);
    startIdRef.current = id;
    setDragSelected(new Set([id]));
  }, []);

  const handlePointerEnter = useCallback((id: string) => {
    if (!isDragging || !startIdRef.current) return;
    const range = getRange(startIdRef.current, id);
    setDragSelected(new Set(range));
  }, [isDragging, getRange]);

  const handlePointerUp = useCallback(() => {
    if (isDragging && dragSelected.size > 0) {
      onSelectionComplete?.(Array.from(dragSelected));
    }
    setIsDragging(false);
    startIdRef.current = null;
    setDragSelected(new Set());
  }, [isDragging, dragSelected, onSelectionComplete]);

  return {
    isDragging,
    dragSelected,
    setSelectableIds,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
  };
}
