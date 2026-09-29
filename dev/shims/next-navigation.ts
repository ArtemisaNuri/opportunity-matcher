import * as React from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getPath = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0];

export function usePathname() {
  return React.useSyncExternalStore(subscribe, getPath, getPath);
}

export function useRouter() {
  return {
    push: (href: string) => {
      window.location.hash = href;
      window.scrollTo(0, 0);
    },
    replace: (href: string) => {
      window.location.hash = href;
    },
    back: () => window.history.back(),
    refresh: () => {},
  };
}

export function useParams() {
  const path = usePathname();
  const m = path.match(/^\/opportunities\/([^/]+)/);
  return m ? { id: decodeURIComponent(m[1]) } : {};
}

export function useSearchParams() {
  return new URLSearchParams(window.location.hash.split("?")[1] ?? "");
}

export class NotFoundError extends Error {}
export function notFound(): never {
  throw new NotFoundError("not found");
}
