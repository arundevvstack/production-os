"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  
  // Track the locally selected theme before saving
  const [localTheme, setLocalTheme] = React.useState<string | undefined>(theme);

  // Update local state when modal opens/closes or global theme changes
  React.useEffect(() => {
    if (open) setLocalTheme(theme);
  }, [open, theme]);

  const handleSave = () => {
    if (localTheme) {
      setTheme(localTheme);
      toast({ title: "Settings Saved", description: "Your theme preference has been applied." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appearance Settings</DialogTitle>
          <DialogDescription>
            Customize the look and feel of your workspace. Choose a theme below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium leading-none">Theme Preference</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setLocalTheme("light")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  localTheme === "light" 
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600" 
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500"
                }`}
              >
                <Sun className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">Light</span>
              </button>
              
              <button
                onClick={() => setLocalTheme("dark")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  localTheme === "dark" 
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600" 
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500"
                }`}
              >
                <Moon className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">Dark (B&W)</span>
              </button>
              
              <button
                onClick={() => setLocalTheme("system")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  localTheme === "system" 
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600" 
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500"
                }`}
              >
                <Monitor className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">System</span>
              </button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
