"use client";

import * as React from "react";
import { animate, useReducedMotion } from "motion/react";

/** Counts up to `value` when it changes. Renders the final value on the server. */
export function AnimatedNumber({
  value,
  duration = 0.9,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(0);
  const prev = React.useRef(0);
  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);
  return <span className={className}>{format(display)}</span>;
}
