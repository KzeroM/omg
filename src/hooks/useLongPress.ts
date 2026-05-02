import { useRef, useCallback, useEffect } from "react";

export function useLongPress(onLongPress: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const callbackRef = useRef(onLongPress);

  useEffect(() => {
    callbackRef.current = onLongPress;
  });

  const start = useCallback(
    (_e: React.TouchEvent) => {
      movedRef.current = false;
      timerRef.current = setTimeout(() => {
        if (!movedRef.current) callbackRef.current();
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback(() => {
    movedRef.current = true;
    cancel();
  }, [cancel]);

  return { onTouchStart: start, onTouchEnd: cancel, onTouchMove: move };
}
