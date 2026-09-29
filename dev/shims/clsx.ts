export type ClassValue = any;
export function clsx(...inputs: any[]): string {
  const out: string[] = [];
  const walk = (v: any) => {
    if (!v) return;
    if (typeof v === "string" || typeof v === "number") out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") for (const [k, on] of Object.entries(v)) if (on) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(" ");
}
export default clsx;
