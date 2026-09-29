import * as React from "react";

/** Preview-only stand-in for lucide icons: a neutral glyph at the same size. */
export function makeIcon(name: string) {
  const Icon = ({ className, size = 24, strokeWidth = 2, ...rest }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={["lucide", className].filter(Boolean).join(" ")}
      data-icon={name}
      aria-hidden="true"
      {...rest}
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M9 12h6" />
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}
