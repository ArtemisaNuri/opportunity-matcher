import { FolderKanbanIcon, SettingsIcon, TargetIcon, UsersIcon, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Route prefixes that also mark this item active. */
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Opportunities", icon: TargetIcon, match: ["/opportunities"] },
  { href: "/team", label: "Team", icon: UsersIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/" || (item.match ?? []).some((m) => pathname.startsWith(m));
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
