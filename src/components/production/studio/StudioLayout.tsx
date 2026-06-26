import React from "react";

export function StudioLayout({
  contextPanel,
  workspacePanel,
  historyPanel,
  consolePanel
}: {
  contextPanel: React.ReactNode;
  workspacePanel: React.ReactNode;
  historyPanel: React.ReactNode;
  consolePanel: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-8 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top 3-Column Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Context */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900 overflow-y-auto">
          {contextPanel}
        </div>

        {/* Center: Generation Workspace */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-slate-950">
          {workspacePanel}
        </div>

        {/* Right: Version History */}
        <div className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900 overflow-y-auto">
          {historyPanel}
        </div>
      </div>

      {/* Bottom: Console */}
      <div className="h-48 flex-shrink-0 border-t border-slate-800 bg-slate-950 overflow-y-auto">
        {consolePanel}
      </div>
    </div>
  );
}
