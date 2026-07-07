"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { autoSaveScript, rewriteScriptWithAI } from "@/app/projects/[id]/script/actions";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import CharacterCount from '@tiptap/extension-character-count';
import { format } from "date-fns";

interface ScriptEditorProps {
  initialContent: string;
  scriptId: string;
  isReadOnly: boolean;
}

export function ScriptEditor({ initialContent, scriptId, isReadOnly }: ScriptEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const params = useParams();
  const projectId = params.id as string;

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
    ],
    content: initialContent || "<p>Start writing your script here...</p>",
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none min-h-[400px]",
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced auto-save
      const html = editor.getHTML();
      setIsSaving(true);
      const timeout = setTimeout(async () => {
        try {
          await autoSaveScript(scriptId, html);
          setLastSaved(new Date());
        } finally {
          setIsSaving(false);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    },
  });

  const handleRewrite = async (actionType: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText) return;

    setIsRewriting(true);
    try {
      const newText = await rewriteScriptWithAI(projectId, selectedText, actionType);
      editor.chain().focus().insertContent(newText).run();
      toast({ title: "Rewrite Successful", description: "The text was updated by AI." });
    } catch (e: any) {
      toast({ title: "AI Rewrite Failed", description: e.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsRewriting(false);
    }
  };

  // Effect to handle switching versions where initialContent changes
  useEffect(() => {
    if (editor && editor.getHTML() !== initialContent) {
      // Small timeout to prevent flashing and cursor jumps if editing
      setTimeout(() => editor.commands.setContent(initialContent), 0);
    }
  }, [initialContent, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  if (!editor) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="relative">
      {isSaving && (
        <div className="absolute top-2 right-2 flex items-center text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded shadow-sm z-10">
          <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Saving...
        </div>
      )}
      <div className="border rounded-b-2xl bg-white shadow-sm overflow-hidden p-6 min-h-[500px]">
        {editor && !isReadOnly && (
          <BubbleMenu editor={editor} className="bg-white border shadow-lg rounded-xl flex flex-wrap gap-1 p-1 max-w-sm w-max overflow-hidden z-50">
            {isRewriting ? (
              <div className="px-3 py-2 text-sm text-purple-600 flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rewriting...
              </div>
            ) : (
              <>
                <div className="px-2 py-1 flex items-center text-xs font-semibold text-purple-600 border-r mr-1">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Rewrite
                </div>
                {['Rewrite', 'Expand', 'Shorten', 'Improve Dialogue', 'Improve Narrative', 'Convert Tone', 'Grammar Fix', 'Translate', 'Continue Writing'].map((action) => (
                  <button 
                    key={action}
                    onClick={() => handleRewrite(action)}
                    className="text-xs px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
                  >
                    {action}
                  </button>
                ))}
              </>
            )}
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
        <div className="flex items-center space-x-4">
          <span>{editor.storage.characterCount.words()} words</span>
          <span>{editor.storage.characterCount.characters()} characters</span>
        </div>
        <div>
          {lastSaved && <span>Last saved: {format(lastSaved, "h:mm:ss a")}</span>}
        </div>
      </div>
    </div>
  );
}
