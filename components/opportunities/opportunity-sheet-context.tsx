"use client";

import * as React from "react";
import { OpportunitySheet } from "@/components/opportunities/opportunity-sheet";

interface SheetState {
  open: boolean;
  /** Present when editing an existing opportunity. */
  editId?: string;
}

interface OpportunitySheetApi {
  /** Opens the Add Opportunity sheet, or the edit sheet when an id is given. */
  openSheet: (editId?: string) => void;
  closeSheet: () => void;
}

const Ctx = React.createContext<OpportunitySheetApi | null>(null);

export function OpportunitySheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SheetState>({ open: false });
  const api = React.useMemo<OpportunitySheetApi>(
    () => ({
      openSheet: (editId) => setState({ open: true, editId }),
      closeSheet: () => setState((s) => ({ ...s, open: false })),
    }),
    [],
  );
  return (
    <Ctx.Provider value={api}>
      {children}
      <OpportunitySheet
        open={state.open}
        editId={state.editId}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      />
    </Ctx.Provider>
  );
}

export function useOpportunitySheet(): OpportunitySheetApi {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useOpportunitySheet must be used inside OpportunitySheetProvider");
  return ctx;
}
