import * as React from "react";

type T = { id: number; message: string; description?: string };
let toasts: T[] = [];
const listeners = new Set<() => void>();
const push = (message: string, opts: any = {}) => {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, description: opts.description }].slice(-3);
  listeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l());
  }, 4000);
  return id;
};
export const toast: any = Object.assign(push, { success: push, error: push, info: push, message: push, dismiss: () => {} });
export type ToasterProps = any;
export function Toaster() {
  const list = React.useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => toasts,
  );
  return (
    <div className="fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2">
      {list.map((t) => (
        <div key={t.id} className="rounded-xl border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
          <div className="font-medium">{t.message}</div>
          {t.description ? <div className="text-xs text-muted-foreground">{t.description}</div> : null}
        </div>
      ))}
    </div>
  );
}
