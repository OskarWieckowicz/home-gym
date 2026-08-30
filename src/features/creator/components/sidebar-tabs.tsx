import { useRef, type KeyboardEvent } from "react";

export const SIDEBAR_TABS = ["Equipment", "Room", "Project items"] as const;
export type SidebarTab = (typeof SIDEBAR_TABS)[number];

export function SidebarTabs({ id, activeTab, onChange }: {
  readonly id: string;
  readonly activeTab: SidebarTab;
  readonly onChange: (tab: SidebarTab) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = SIDEBAR_TABS.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % SIDEBAR_TABS.length,
      ArrowLeft: (index + last) % SIDEBAR_TABS.length,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(SIDEBAR_TABS[next]);
    buttons.current[next]?.focus();
  }

  return (
    <div className="creator-sidebar-tabs" role="tablist" aria-label="Build tools">
      {SIDEBAR_TABS.map((tab, index) => (
        <button
          aria-controls={`${id}-panel-${index}`}
          aria-selected={activeTab === tab}
          id={`${id}-tab-${index}`}
          key={tab}
          onClick={() => onChange(tab)}
          onKeyDown={(event) => navigate(event, index)}
          ref={(button) => { buttons.current[index] = button; }}
          role="tab"
          tabIndex={activeTab === tab ? 0 : -1}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
