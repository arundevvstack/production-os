"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Sparkles, Loader2 } from "lucide-react";

interface ScriptEntryOptionsProps {
  onCreateNew: () => void;
  onUpload: (file: File) => Promise<void>;
  onGenerate: () => void;
}

export function ScriptEntryOptions({ onCreateNew, onUpload, onGenerate }: ScriptEntryOptionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">No Script Available</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Get started by creating a new script, uploading an existing file, or generating one with AI.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={onCreateNew} variant="default" className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Script
        </Button>
        
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline"
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.docx,.pdf,.md,.fountain"
          onChange={handleFileChange}
        />

        <Button onClick={onGenerate} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
      </div>
    </div>
  );
}
