import * as React from "react";

/**
 * Preview-only stand-in for motion/react: renders plain elements with the
 * FINAL animated values applied, so layouts and end states can be inspected.
 */
const MOTION_PROPS = new Set([
  "initial", "animate", "exit", "transition", "layout", "layoutId", "whileHover", "whileTap",
  "whileInView", "whileFocus", "variants", "viewport", "onAnimationComplete", "custom", "layoutDependency",
]);

function toStyle(target: any): React.CSSProperties {
  if (!target || typeof target !== "object") return {};
  const style: any = {};
  const transforms: string[] = [];
  for (const [k, v] of Object.entries(target)) {
    const val = Array.isArray(v) ? v[v.length - 1] : v;
    if (k === "x") transforms.push(`translateX(${typeof val === "number" ? `${val}px` : val})`);
    else if (k === "y") transforms.push(`translateY(${typeof val === "number" ? `${val}px` : val})`);
    else if (k === "scale") transforms.push(`scale(${val})`);
    else if (k === "scaleX") transforms.push(`scaleX(${val})`);
    else if (k === "scaleY") transforms.push(`scaleY(${val})`);
    else if (k === "rotate") transforms.push(`rotate(${typeof val === "number" ? `${val}deg` : val})`);
    else if (k === "pathLength") continue;
    else style[k] = val;
  }
  if (transforms.length) style.transform = transforms.join(" ");
  return style;
}

const cache = new Map<string, any>();
function make(tag: string) {
  if (cache.has(tag)) return cache.get(tag);
  const C = React.forwardRef<any, any>((props, ref) => {
    const clean: any = {};
    for (const [k, v] of Object.entries(props)) if (!MOTION_PROPS.has(k)) clean[k] = v;
    const anim = typeof props.animate === "string" && props.variants ? props.variants[props.animate] : props.animate;
    clean.style = { ...toStyle(anim), ...(props.style ?? {}) };
    return React.createElement(tag, { ...clean, ref });
  });
  cache.set(tag, C);
  return C;
}

export const motion: any = new Proxy({}, { get: (_t, tag: string) => make(tag) });
export const AnimatePresence = ({ children }: any) => <>{children}</>;
export const MotionConfig = ({ children }: any) => <>{children}</>;
export const LayoutGroup = ({ children }: any) => <>{children}</>;
export const useReducedMotion = () => false;
export const useInView = () => true;
export function animate(_from: number, to: number, opts: any = {}) {
  opts.onUpdate?.(to);
  opts.onComplete?.();
  return { stop() {} };
}
export const useMotionValue = (v: number) => ({ get: () => v, set: () => {} });
export const useSpring = (v: any) => v;
export const useTransform = () => ({ get: () => 0 });
