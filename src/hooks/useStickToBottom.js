import { useState, useRef, useCallback, useEffect } from "react";

export function useStickToBottom() {
  const containerRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const isNearBottomRef = useRef(true);

  const checkScrollPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is more than 160px from bottom, they are scrolled up
    const scrolledUp = distanceToBottom > 160;
    setIsScrolledUp(scrolledUp);
    isNearBottomRef.current = !scrolledUp;
  }, []);

  const scrollToBottom = useCallback((options = { smooth: true }) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: options.smooth ? "smooth" : "auto",
    });
    setIsScrolledUp(false);
    isNearBottomRef.current = true;
  }, []);

  const scrollToElement = useCallback((element, options = { smooth: true }) => {
    const el = containerRef.current;
    if (!el || !element) return;
    const containerTop = el.getBoundingClientRect().top;
    const targetTop = element.getBoundingClientRect().top;
    const offset = targetTop - containerTop + el.scrollTop - 20; // 20px padding

    el.scrollTo({
      top: Math.max(0, offset),
      behavior: options.smooth ? "smooth" : "auto",
    });
  }, []);

  const scrollToMessage = useCallback(
    (messageId, options = { smooth: true }) => {
      if (!messageId) return;
      const el = containerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        scrollToElement(el, options);
      }
    },
    [scrollToElement]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      checkScrollPosition();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkScrollPosition]);

  return {
    containerRef,
    isScrolledUp,
    scrollToBottom,
    scrollToElement,
    scrollToMessage,
    checkScrollPosition,
  };
}

export default useStickToBottom;

