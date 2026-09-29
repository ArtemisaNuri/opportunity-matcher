export type VariantProps<_T> = any;
export function cva(base = "", config: any = {}) {
  return (props: any = {}) => {
    const out = [base];
    const variants = config.variants ?? {};
    for (const key of Object.keys(variants)) {
      const v = props[key] ?? config.defaultVariants?.[key];
      if (v != null && variants[key][v]) out.push(variants[key][v]);
    }
    if (props.className) out.push(props.className);
    if (props.class) out.push(props.class);
    return out.filter(Boolean).join(" ");
  };
}
