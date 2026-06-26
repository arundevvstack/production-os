import React from "react";
import Link from "next/link";
import { Film, LogOut, Settings, LayoutDashboard } from "lucide-react";

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
              <Film className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">DP Production OS</h1>
          </div>
          
          <nav className="space-y-2">
            <Link 
              href="/production/projects" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-slate-100 text-black"
            >
              <LayoutDashboard className="h-4 w-4" />
              Projects
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-black cursor-pointer">
            <Settings className="h-4 w-4" />
            Workspace Settings
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 cursor-pointer">
            <LogOut className="h-4 w-4" />
            Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
