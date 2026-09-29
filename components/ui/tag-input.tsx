"use client";

import * as React from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chip input: type and press Enter (or comma) to add, Backspace on empty to remove the last,
 * click a suggestion to add it. Values are de-duplicated case-insensitively.
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  id,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (!t || has(t)) return;
    onChange([...value, t]);
  };
  const remove = (t: string) => onChange(value.filter((v) => v !== t));
  const open = suggestions.filter((s) => !has(s));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25",
          ariaInvalid && "border-destructive",
        )}
      >
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex h-6 animate-scale-in items-center gap-1 rounded-md bg-accent pr-1 pl-2 text-xs font-medium text-accent-foreground"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="cursor-pointer rounded p-0.5 opacity-70 hover:bg-background/60 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) {
              add(v);
              setDraft("");
            } else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {open.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-dashed px-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <PlusIcon className="size-3" />
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
