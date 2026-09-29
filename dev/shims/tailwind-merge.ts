/** Preview-only: joins classes (no conflict resolution; later classes may not win). */
export function twMerge(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
