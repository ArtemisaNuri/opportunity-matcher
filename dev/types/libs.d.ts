// Loose typings for packages that cannot be installed in this environment.
// They exist only so `tsc` can check the app's own code; the real packages ship full types.

declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template?: string };
    description?: string;
    [k: string]: unknown;
  }
  export interface NextConfig {
    [k: string]: unknown;
  }
}
declare module "next/link" {
  import type { FC, ReactNode } from "react";
  const Link: FC<{ href: string; children?: ReactNode; className?: string; prefetch?: boolean; [k: string]: any }>;
  export default Link;
}
declare module "next/navigation" {
  export function useRouter(): { push(href: string): void; replace(href: string): void; back(): void; refresh(): void };
  export function usePathname(): string | null;
  export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>(): T;
  export function useSearchParams(): URLSearchParams;
  export function notFound(): never;
}
declare module "next/font/google" {
  type FontFn = (opts: { variable?: string; subsets?: string[]; weight?: string | string[] }) => {
    className: string;
    variable: string;
  };
  export const Geist: FontFn;
  export const Geist_Mono: FontFn;
}
declare module "next-themes" {
  import type { FC, ReactNode } from "react";
  export const ThemeProvider: FC<{
    children?: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }>;
  export function useTheme(): {
    theme?: string;
    resolvedTheme?: string;
    setTheme(theme: string): void;
    systemTheme?: string;
  };
}
declare module "motion/react" {
  import type { FC, ReactNode } from "react";
  export const motion: { [tag: string]: FC<any> };
  export const AnimatePresence: FC<{ children?: ReactNode; mode?: "wait" | "sync" | "popLayout"; initial?: boolean }>;
  export const MotionConfig: FC<{ children?: ReactNode; reducedMotion?: "user" | "always" | "never" }>;
  export const LayoutGroup: FC<{ children?: ReactNode; id?: string }>;
  export function useReducedMotion(): boolean | null;
  export function useInView(ref: any, opts?: { once?: boolean; margin?: string; amount?: number }): boolean;
  export function animate(
    from: number,
    to: number,
    opts: { duration?: number; ease?: any; delay?: number; onUpdate?: (v: number) => void; onComplete?: () => void },
  ): { stop(): void };
  export function useMotionValue(v: number): any;
  export function useSpring(v: any, opts?: any): any;
  export function useTransform(...args: any[]): any;
}
declare module "class-variance-authority" {
  export type VariantProps<T extends (...args: any) => any> = Omit<NonNullable<Parameters<T>[0]>, "class" | "className">;
  type Config<V> = { variants?: V; defaultVariants?: { [K in keyof V]?: keyof V[K] }; compoundVariants?: any[] };
  export function cva<V extends Record<string, Record<string, string>>>(
    base?: string,
    config?: Config<V>,
  ): (props?: { [K in keyof V]?: keyof V[K] | null } & { class?: string; className?: string }) => string;
}
declare module "clsx" {
  export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[] | Record<string, unknown>;
  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}
declare module "tailwind-merge" {
  export function twMerge(...classes: string[]): string;
}
declare module "recharts";
declare module "radix-ui";
declare module "sonner" {
  import type { FC } from "react";
  export type ToasterProps = { theme?: "light" | "dark" | "system"; position?: string; className?: string; toastOptions?: any; [k: string]: any };
  export const Toaster: FC<ToasterProps>;
  type ToastFn = (message: string, opts?: { description?: string; action?: any; duration?: number }) => string | number;
  export const toast: ToastFn & { success: ToastFn; error: ToastFn; info: ToastFn; message: ToastFn; dismiss(id?: string | number): void };
}

declare module "node:test" {
  export function test(name: string, fn: () => void | Promise<void>): void;
}
declare module "node:assert/strict" {
  const assert: {
    (value: unknown, message?: string): asserts value;
    ok(value: unknown, message?: string): asserts value;
    equal<T>(actual: T, expected: T, message?: string): void;
    notEqual<T>(actual: T, expected: T, message?: string): void;
    deepEqual<T>(actual: T, expected: T, message?: string): void;
  };
  export default assert;
}
