// Minimal React 19 typings for offline type-checking (the real @types/react could not be installed here).
declare module "react" {
  export type Key = string | number | bigint;
  export interface ReactElement<P = any> {
    type: any;
    props: P;
    key: string | null;
  }
  export type ReactNode =
    | ReactElement
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Iterable<ReactNode>
    | Promise<ReactNode>;
  export type JSXElementConstructor<P> = (props: P) => ReactNode;
  export type FC<P = {}> = (props: P) => ReactNode;
  export type ComponentType<P = {}> = FC<P>;
  export type ElementType = string | ComponentType<any>;
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export interface RefObject<T> {
    current: T;
  }
  export type Ref<T> = RefObject<T | null> | ((instance: T | null) => void) | null;
  export interface Context<T> {
    Provider: FC<{ value: T; children?: ReactNode }>;
  }
  export type CSSProperties = { [key: string]: string | number | undefined };

  export interface SyntheticEvent<T = Element, E = Event> {
    currentTarget: T;
    target: EventTarget & T;
    nativeEvent: E;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export interface MouseEvent<T = Element> extends SyntheticEvent<T, globalThis.MouseEvent> {
    clientX: number;
    clientY: number;
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
  }
  export interface PointerEvent<T = Element> extends MouseEvent<T> {}
  export interface KeyboardEvent<T = Element> extends SyntheticEvent<T, globalThis.KeyboardEvent> {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
  }
  export interface FocusEvent<T = Element> extends SyntheticEvent<T, globalThis.FocusEvent> {}
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T & { value: any; checked?: boolean };
  }
  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

  type IntrinsicProps = {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    key?: Key;
    ref?: any;
    [attr: string]: any;
  };
  export type ComponentProps<T> = T extends string
    ? IntrinsicProps
    : T extends (props: infer P) => any
      ? P
      : any;
  export type ComponentPropsWithoutRef<T> = ComponentProps<T>;
  export type HTMLAttributes<T> = IntrinsicProps;

  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useReducer<S, A>(reducer: (s: S, a: A) => S, initial: S): [S, Dispatch<A>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): RefObject<T>;
  export function useRef<T>(initial: T | null): RefObject<T | null>;
  export function useRef<T = undefined>(): RefObject<T | undefined>;
  export function useContext<T>(ctx: Context<T>): T;
  export function createContext<T>(value: T): Context<T>;
  export function useId(): string;
  export function useDeferredValue<T>(value: T): T;
  export function useTransition(): [boolean, (cb: () => void) => void];
  export function useSyncExternalStore<T>(
    subscribe: (onChange: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ): T;
  export function memo<P>(c: FC<P>): FC<P>;
  export function forwardRef<T, P = {}>(render: (props: P, ref: Ref<T>) => ReactNode): FC<P & { ref?: Ref<T> }>;
  export function cloneElement(el: ReactElement, props?: any, ...children: ReactNode[]): ReactElement;
  export function isValidElement(v: unknown): v is ReactElement;
  export function createElement(type: any, props?: any, ...children: ReactNode[]): ReactElement;
  export const Fragment: FC<{ children?: ReactNode }>;
  export const Suspense: FC<{ fallback?: ReactNode; children?: ReactNode }>;
  export const Children: {
    map<T>(children: ReactNode, fn: (child: ReactNode, i: number) => T): T[];
    toArray(children: ReactNode): ReactNode[];
    count(children: ReactNode): number;
    only(children: ReactNode): ReactElement;
  };
}

declare module "react/jsx-runtime" {
  import type { Key, ReactElement, ReactNode } from "react";
  export namespace JSX {
    interface Element extends ReactElement {}
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicAttributes {
      key?: Key;
    }
    type ElementType = string | ((props: any) => ReactNode | Promise<ReactNode>);
    type EventProps = {
      onClick?: (e: import("react").MouseEvent<any>) => void;
      onDoubleClick?: (e: import("react").MouseEvent<any>) => void;
      onMouseMove?: (e: import("react").MouseEvent<any>) => void;
      onMouseEnter?: (e: import("react").MouseEvent<any>) => void;
      onMouseLeave?: (e: import("react").MouseEvent<any>) => void;
      onPointerDown?: (e: import("react").PointerEvent<any>) => void;
      onPointerEnter?: (e: import("react").PointerEvent<any>) => void;
      onPointerLeave?: (e: import("react").PointerEvent<any>) => void;
      onChange?: (e: import("react").ChangeEvent<any>) => void;
      onInput?: (e: import("react").ChangeEvent<any>) => void;
      onKeyDown?: (e: import("react").KeyboardEvent<any>) => void;
      onKeyUp?: (e: import("react").KeyboardEvent<any>) => void;
      onFocus?: (e: import("react").FocusEvent<any>) => void;
      onBlur?: (e: import("react").FocusEvent<any>) => void;
      onSubmit?: (e: import("react").FormEvent<any>) => void;
    };
    interface IntrinsicElements {
      [name: string]: EventProps & { className?: string; children?: ReactNode; key?: Key; ref?: any; [attr: string]: any };
    }
  }
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react-dom" {
  export function createPortal(children: import("react").ReactNode, container: Element): import("react").ReactElement;
}

declare namespace React {
  type ReactNode = import("react").ReactNode;
  type ComponentProps<T> = import("react").ComponentProps<T>;
}
declare module "*.css";
