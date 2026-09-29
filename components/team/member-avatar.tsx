"use client";

import * as React from "react";
import { initials } from "@/lib/format";
import type { TeamMember } from "@/lib/domain/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Neutral/purple tints (tokens only), picked deterministically from the name. */
const TINTS = [
  "bg-primary/15 text-primary",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground ring-1 ring-border ring-inset",
  "bg-primary/25 text-foreground",
  "bg-muted text-foreground ring-1 ring-border ring-inset",
  "bg-primary/8 text-primary",
] as const;

export function avatarTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function MemberAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        avatarTint(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function MemberIdentity({ member, className }: { member: Pick<TeamMember, "name" | "role">; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <MemberAvatar name={member.name} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{member.name}</span>
        <span className="truncate text-xs text-muted-foreground">{member.role}</span>
      </div>
    </div>
  );
}

/** Overlapping avatars with a "+n" overflow chip. */
export function AvatarStack({ members, max = 5, className }: { members: TeamMember[]; max?: number; className?: string }) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-1", className)} aria-label={members.map((m) => m.name).join(", ")}>
      {shown.map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0 rounded-full bg-card ring-2 ring-card outline-none focus-visible:ring-ring" tabIndex={0}>
              <MemberAvatar name={m.name} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {m.name} · {m.role}
          </TooltipContent>
        </Tooltip>
      ))}
      {rest > 0 ? (
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
