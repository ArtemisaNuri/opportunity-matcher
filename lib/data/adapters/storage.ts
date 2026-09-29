/**
 * Storage adapters. This is the ONLY place allowed to touch `localStorage`.
 * Swap `LocalStorageAdapter` for an API/Supabase-backed repository later
 * without changing any UI code.
 */
export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  read(key: string): string | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  write(key: string, value: string): void {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage blocked (private mode): the app keeps working in memory.
    }
  }
  remove(key: string): void {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export class MemoryAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  read(key: string) {
    return this.store.get(key) ?? null;
  }
  write(key: string, value: string) {
    this.store.set(key, value);
  }
  remove(key: string) {
    this.store.delete(key);
  }
}
