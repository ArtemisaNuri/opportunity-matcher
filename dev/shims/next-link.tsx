import * as React from "react";

export default function Link({ href, children, onClick, prefetch: _p, ...rest }: any) {
  return (
    <a
      href={`#${href}`}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
