"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-lg",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
