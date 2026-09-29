import * as React from "react";
import { createRoot } from "react-dom/client";
import { usePathname } from "next/navigation";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell/app-shell";
import { OpportunitiesView } from "@/components/views/opportunities-view";
import { OpportunityDetailView } from "@/components/views/opportunity-detail-view";
import { TeamView } from "@/components/views/team-view";
import { ProjectsView } from "@/components/views/projects-view";
import { SettingsView } from "@/components/views/settings-view";

class Boundary extends (React as any).Component {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    const self = this as any;
    if (self.state.error) {
      (window as any).__previewError = String(self.state.error?.stack ?? self.state.error);
      return <pre className="m-6 rounded-lg border border-red-500 p-4 text-xs text-red-600">{String(self.state.error?.stack)}</pre>;
    }
    return self.props.children;
  }
}

function Router() {
  const path = usePathname() ?? "/";
  let view: React.ReactNode;
  if (path.startsWith("/opportunities/")) view = <OpportunityDetailView />;
  else if (path === "/team") view = <TeamView />;
  else if (path === "/projects") view = <ProjectsView />;
  else if (path === "/settings") view = <SettingsView />;
  else view = <OpportunitiesView />;
  return <Boundary key={path}>{view}</Boundary>;
}

window.addEventListener("error", (e) => ((window as any).__previewError = String(e.error?.stack ?? e.message)));

createRoot(document.getElementById("root")!).render(
  <Boundary>
    <Providers>
      <AppShell>
        <Router />
      </AppShell>
    </Providers>
  </Boundary>,
);
