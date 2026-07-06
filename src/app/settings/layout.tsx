import React from "react";
import Link from "next/link";
import { Settings, Key, Bot } from "lucide-react";

export default function ProductionSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white h-screen fixed">
        <div className="p-4 border-b">
          <Link href="/projects" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-2">
            &larr; Back to Projects
          </Link>
        </div>
        <div className="p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Workspace Settings</h2>
          <nav className="space-y-1">
            <Link href="/production/settings/ai-providers" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm">
              <Bot className="h-4 w-4" />
              AI Providers
            </Link>
            <Link href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm">
              <Key className="h-4 w-4" />
              API Access
            </Link>
            <Link href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm">
              <Settings className="h-4 w-4" />
              Preferences
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
