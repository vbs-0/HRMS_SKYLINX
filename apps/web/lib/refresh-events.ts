"use client";

export const DATA_REFRESH_EVENT = "peopleos:data-refresh";

export function requestDataRefresh(scope: string) {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT, { detail: { scope } }));
}

export function onDataRefresh(scope: string, callback: () => void) {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ scope: string }>;
    if (custom.detail?.scope === scope || custom.detail?.scope === "all") callback();
  };
  window.addEventListener(DATA_REFRESH_EVENT, handler);
  return () => window.removeEventListener(DATA_REFRESH_EVENT, handler);
}
