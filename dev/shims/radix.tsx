/**
 * Preview-only stand-ins for the `radix-ui` primitives the app uses. They are
 * functional enough to open/close, switch and select, but carry none of
 * Radix's focus management or positioning. The real app uses real Radix.
 */
import * as React from "react";
import { createPortal } from "react-dom";

function mergeProps(slotProps: any, childProps: any) {
  const merged: any = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    if (/^on[A-Z]/.test(key) && typeof slotProps[key] === "function" && typeof childProps[key] === "function") {
      merged[key] = (...args: any[]) => {
        childProps[key](...args);
        slotProps[key](...args);
      };
    }
  }
  merged.className = [slotProps.className, childProps.className].filter(Boolean).join(" ") || undefined;
  merged.style = { ...(slotProps.style ?? {}), ...(childProps.style ?? {}) };
  return merged;
}

const SlotComp = React.forwardRef<any, any>(({ children, ...props }, ref) => {
  const child = React.Children.only(children) as React.ReactElement<any>;
  return React.cloneElement(child, { ...mergeProps(props, child.props), ref });
});

function render(tag: string, asChild: boolean | undefined, props: any) {
  if (asChild) return <SlotComp {...props} />;
  return React.createElement(tag, props);
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  return [
    isControlled ? (value as T) : inner,
    (v: T) => {
      if (!isControlled) setInner(v);
      onChange?.(v);
    },
  ];
}

// ------------------------------------------------------------------ Slot
export const Slot = { Slot: SlotComp, Root: SlotComp };

// ------------------------------------------------------------------ Label / Separator / Progress
export const Label = {
  Root: ({ asChild, ...p }: any) => render("label", asChild, p),
};
export const Separator = {
  Root: ({ orientation = "horizontal", decorative: _d, asChild, ...p }: any) =>
    render("div", asChild, { role: "separator", "data-orientation": orientation, ...p }),
};
export const Progress = {
  Root: ({ value: _v, asChild, ...p }: any) => render("div", asChild, { role: "progressbar", ...p }),
  Indicator: ({ asChild, ...p }: any) => render("div", asChild, p),
};

// ------------------------------------------------------------------ Dialog (also used for Sheet)
const DialogCtx = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });

function DialogRoot({ open, defaultOpen = false, onOpenChange, children }: any) {
  const [o, setO] = useControllable<boolean>(open, defaultOpen, onOpenChange);
  return <DialogCtx.Provider value={{ open: o, setOpen: setO }}>{children}</DialogCtx.Provider>;
}
function DialogPortal({ children }: any) {
  const { open } = React.useContext(DialogCtx);
  return open ? createPortal(children, document.body) : null;
}
function DialogContent({ asChild, onOpenAutoFocus: _a, onCloseAutoFocus: _b, onEscapeKeyDown: _c, onInteractOutside: _d, onPointerDownOutside: _e, forceMount: _f, ...p }: any) {
  const { setOpen } = React.useContext(DialogCtx);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
  return render("div", asChild, { role: "dialog", "data-state": "open", ...p });
}
export const Dialog = {
  Root: DialogRoot,
  Trigger: ({ asChild, onClick, ...p }: any) => {
    const { setOpen } = React.useContext(DialogCtx);
    return render("button", asChild, { ...p, onClick: (e: any) => (onClick?.(e), setOpen(true)) });
  },
  Portal: DialogPortal,
  Overlay: ({ asChild, ...p }: any) => {
    const { setOpen } = React.useContext(DialogCtx);
    return render("div", asChild, { "data-state": "open", onClick: () => setOpen(false), ...p });
  },
  Content: DialogContent,
  Title: ({ asChild, ...p }: any) => render("h2", asChild, p),
  Description: ({ asChild, ...p }: any) => render("p", asChild, p),
  Close: ({ asChild, onClick, ...p }: any) => {
    const { setOpen } = React.useContext(DialogCtx);
    return render("button", asChild, { type: "button", ...p, onClick: (e: any) => (onClick?.(e), setOpen(false)) });
  },
};

// ------------------------------------------------------------------ Tabs
const TabsCtx = React.createContext<{ value: string; set: (v: string) => void }>({ value: "", set: () => {} });
export const Tabs = {
  Root: ({ value, defaultValue = "", onValueChange, asChild, children, ...p }: any) => {
    const [v, set] = useControllable<string>(value, defaultValue, onValueChange);
    return <TabsCtx.Provider value={{ value: v, set }}>{render("div", asChild, { ...p, children })}</TabsCtx.Provider>;
  },
  List: ({ asChild, ...p }: any) => render("div", asChild, { role: "tablist", ...p }),
  Trigger: ({ value, asChild, ...p }: any) => {
    const ctx = React.useContext(TabsCtx);
    const active = ctx.value === value;
    return render("button", asChild, {
      type: "button",
      role: "tab",
      "data-state": active ? "active" : "inactive",
      "aria-selected": active,
      onClick: () => ctx.set(value),
      ...p,
    });
  },
  Content: ({ value, asChild, forceMount: _f, ...p }: any) => {
    const ctx = React.useContext(TabsCtx);
    return ctx.value === value ? render("div", asChild, { role: "tabpanel", "data-state": "active", ...p }) : null;
  },
};

// ------------------------------------------------------------------ ToggleGroup
const TGCtx = React.createContext<{ value: string; set: (v: string) => void }>({ value: "", set: () => {} });
export const ToggleGroup = {
  Root: ({ value, defaultValue = "", onValueChange, type: _t, asChild, children, ...p }: any) => {
    const [v, set] = useControllable<string>(value, defaultValue, onValueChange);
    return <TGCtx.Provider value={{ value: v, set }}>{render("div", asChild, { role: "group", ...p, children })}</TGCtx.Provider>;
  },
  Item: ({ value, asChild, ...p }: any) => {
    const ctx = React.useContext(TGCtx);
    const on = ctx.value === value;
    return render("button", asChild, {
      type: "button",
      "data-state": on ? "on" : "off",
      "aria-pressed": on,
      onClick: () => ctx.set(on ? "" : value),
      ...p,
    });
  },
};

// ------------------------------------------------------------------ Switch
export const Switch = {
  Root: ({ checked, defaultChecked = false, onCheckedChange, asChild, children, ...p }: any) => {
    const [c, set] = useControllable<boolean>(checked, defaultChecked, onCheckedChange);
    const state = c ? "checked" : "unchecked";
    return render("button", asChild, {
      type: "button",
      role: "switch",
      "aria-checked": c,
      "data-state": state,
      onClick: () => set(!c),
      ...p,
      children: React.Children.map(children, (ch: any) => (React.isValidElement(ch) ? React.cloneElement(ch as any, { "data-state": state }) : ch)),
    });
  },
  Thumb: ({ asChild, ...p }: any) => render("span", asChild, p),
};

// ------------------------------------------------------------------ Tooltip (renders trigger only)
export const Tooltip = {
  Provider: ({ children }: any) => <>{children}</>,
  Root: ({ children }: any) => <>{children}</>,
  Trigger: ({ asChild, ...p }: any) => render("button", asChild, p),
  Portal: () => null,
  Content: () => null,
  Arrow: () => null,
};

// ------------------------------------------------------------------ Popover / DropdownMenu (simple toggles)
function makeMenu() {
  const Ctx = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });
  const Root = ({ open, defaultOpen = false, onOpenChange, children }: any) => {
    const [o, setO] = useControllable<boolean>(open, defaultOpen, onOpenChange);
    return <Ctx.Provider value={{ open: o, setOpen: setO }}>{children}</Ctx.Provider>;
  };
  const Trigger = ({ asChild, onClick, ...p }: any) => {
    const { open, setOpen } = React.useContext(Ctx);
    return render("button", asChild, { type: "button", "data-state": open ? "open" : "closed", ...p, onClick: (e: any) => (onClick?.(e), setOpen(!open)) });
  };
  const Portal = ({ children }: any) => {
    const { open } = React.useContext(Ctx);
    return open ? <>{children}</> : null;
  };
  const Content = ({ asChild, sideOffset: _s, align: _a, side: _sd, collisionPadding: _c, onOpenAutoFocus: _o, ...p }: any) => {
    const { open } = React.useContext(Ctx);
    if (!open) return null;
    return render("div", asChild, { role: "menu", "data-state": "open", ...p, style: { position: "absolute", marginTop: 4, ...(p.style ?? {}) } });
  };
  const Item = ({ asChild, onSelect, onClick, ...p }: any) => {
    const { setOpen } = React.useContext(Ctx);
    return render("div", asChild, { role: "menuitem", tabIndex: -1, ...p, onClick: (e: any) => (onClick?.(e), onSelect?.(e), setOpen(false)) });
  };
  const CheckboxItem = ({ asChild, checked, onCheckedChange, onSelect, children, ...p }: any) =>
    render("div", asChild, {
      role: "menuitemcheckbox",
      "aria-checked": !!checked,
      "data-state": checked ? "checked" : "unchecked",
      ...p,
      onClick: (e: any) => (onSelect?.(e), onCheckedChange?.(!checked)),
      children: <IndicatorCtx.Provider value={!!checked}>{children}</IndicatorCtx.Provider>,
    });
  return {
    Root,
    Trigger,
    Portal,
    Content,
    Item,
    CheckboxItem,
    ItemIndicator: ({ children }: any) => (React.useContext(IndicatorCtx) ? <>{children}</> : null),
    Label: ({ asChild, ...p }: any) => render("div", asChild, p),
    Separator: ({ asChild, ...p }: any) => render("div", asChild, p),
    Group: ({ asChild, ...p }: any) => render("div", asChild, p),
    Anchor: ({ asChild, ...p }: any) => render("div", asChild, p),
    Close: ({ asChild, ...p }: any) => {
      const { setOpen } = React.useContext(Ctx);
      return render("button", asChild, { type: "button", ...p, onClick: () => setOpen(false) });
    },
    Arrow: () => null,
  };
}
const IndicatorCtx = React.createContext(false);
export const DropdownMenu = makeMenu();
export const Popover = makeMenu();

// ------------------------------------------------------------------ Select (renders as a native-like list)
const SelectCtx = React.createContext<{ value: string; set: (v: string) => void; open: boolean; setOpen: (v: boolean) => void; labels: Map<string, React.ReactNode> }>({
  value: "",
  set: () => {},
  open: false,
  setOpen: () => {},
  labels: new Map(),
});
export const Select = {
  Root: ({ value, defaultValue = "", onValueChange, children }: any) => {
    const [v, set] = useControllable<string>(value, defaultValue, onValueChange);
    const [open, setOpen] = React.useState(false);
    const labels = React.useRef(new Map<string, React.ReactNode>()).current;
    return <SelectCtx.Provider value={{ value: v, set, open, setOpen, labels }}>{children}</SelectCtx.Provider>;
  },
  Trigger: ({ asChild, ...p }: any) => {
    const ctx = React.useContext(SelectCtx);
    return render("button", asChild, { type: "button", role: "combobox", "data-state": ctx.open ? "open" : "closed", ...p, onClick: () => ctx.setOpen(!ctx.open) });
  },
  Value: ({ placeholder }: any) => {
    const ctx = React.useContext(SelectCtx);
    return <span data-placeholder={ctx.value ? undefined : ""}>{ctx.value ? ctx.labels.get(ctx.value) ?? ctx.value : placeholder}</span>;
  },
  Icon: ({ asChild, ...p }: any) => render("span", asChild, p),
  Portal: ({ children }: any) => {
    const ctx = React.useContext(SelectCtx);
    // Render hidden when closed so item labels register for <Value>.
    return <div style={ctx.open ? { position: "relative" } : { display: "none" }}>{children}</div>;
  },
  Content: ({ asChild, position: _p, sideOffset: _s, ...p }: any) => render("div", asChild, { role: "listbox", ...p }),
  Viewport: ({ asChild, ...p }: any) => render("div", asChild, p),
  Item: ({ value, asChild, children, ...p }: any) => {
    const ctx = React.useContext(SelectCtx);
    ctx.labels.set(value, children);
    return render("div", asChild, {
      role: "option",
      "aria-selected": ctx.value === value,
      ...p,
      onClick: () => (ctx.set(value), ctx.setOpen(false)),
      children: <IndicatorCtx.Provider value={ctx.value === value}>{children}</IndicatorCtx.Provider>,
    });
  },
  ItemText: ({ children }: any) => <span>{children}</span>,
  ItemIndicator: ({ children }: any) => (React.useContext(IndicatorCtx) ? <>{children}</> : null),
  Group: ({ asChild, ...p }: any) => render("div", asChild, p),
  Label: ({ asChild, ...p }: any) => render("div", asChild, p),
  Separator: ({ asChild, ...p }: any) => render("div", asChild, p),
};

// ------------------------------------------------------------------ Collapsible / Accordion (simple)
const CollCtx = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });
export const Collapsible = {
  Root: ({ open, defaultOpen = false, onOpenChange, asChild, children, ...p }: any) => {
    const [o, setO] = useControllable<boolean>(open, defaultOpen, onOpenChange);
    return <CollCtx.Provider value={{ open: o, setOpen: setO }}>{render("div", asChild, { "data-state": o ? "open" : "closed", ...p, children })}</CollCtx.Provider>;
  },
  Trigger: ({ asChild, ...p }: any) => {
    const { open, setOpen } = React.useContext(CollCtx);
    return render("button", asChild, { type: "button", "data-state": open ? "open" : "closed", ...p, onClick: () => setOpen(!open) });
  },
  Content: ({ asChild, ...p }: any) => {
    const { open } = React.useContext(CollCtx);
    return open ? render("div", asChild, { "data-state": "open", ...p }) : null;
  },
};
