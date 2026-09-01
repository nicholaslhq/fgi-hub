import { useEffect, useRef, useState } from "react";

const MIN_FONT_PX = 12;
const FONT_STEP_PX = 1;
const DEBOUNCE_MS = 100;

export function useAutoFitText(
  text: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
  minFontPx = MIN_FONT_PX,
) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [truncate, setTruncate] = useState(false);
  const truncateRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    textEl.style.whiteSpace = "nowrap";

    const measure = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth === 0) return;

      textEl.style.fontSize = "";
      const defaultWidth = textEl.scrollWidth;
      const computedFontSize = parseFloat(getComputedStyle(textEl).fontSize);

      if (defaultWidth <= containerWidth) {
        if (truncateRef.current) {
          truncateRef.current = false;
          setTruncate(false);
        }
        return;
      }

      let next = computedFontSize;
      while (next > minFontPx && textEl.scrollWidth > containerWidth) {
        next -= FONT_STEP_PX;
        textEl.style.fontSize = `${next}px`;
      }

      const shouldTruncate = next <= minFontPx;
      if (truncateRef.current !== shouldTruncate) {
        truncateRef.current = shouldTruncate;
        setTruncate(shouldTruncate);
      }
    };

    const schedule = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(measure);
      }, DEBOUNCE_MS);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    schedule();

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, containerRef, minFontPx]);

  return { textRef, truncate };
}
