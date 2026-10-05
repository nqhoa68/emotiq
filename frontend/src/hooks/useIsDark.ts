import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');

/** Theo dõi class `dark` trên <html> (Recharts cần màu truyền qua props nên phải biết theme hiện tại). */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
