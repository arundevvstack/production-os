"use client";

import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

export interface CommentType {
  id: string;
  authorName: string;
  content: string;
  created_at: string;
}

interface CommentThreadProps {
  comments: CommentType[];
  onAddComment: (content: string) => void;
}

export function CommentThread({ comments, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment("");
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="bg-slate-50 border-b px-4 py-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-slate-500" />
        <h3 className="font-semibold text-sm">Comments ({comments.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {c.authorName.charAt(0)}
            </div>
            <div className="bg-white border rounded-xl p-3 shadow-sm text-sm">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="font-semibold">{c.authorName}</span>
                <span className="text-[10px] text-slate-400" suppressHydrationWarning>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-10 italic">
            No comments yet. Start the conversation.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3 bg-white flex gap-2">
        <input 
          type="text" 
          placeholder="Add a comment..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-black transition"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim()}
          className="bg-black text-white p-2 rounded-lg disabled:opacity-50 hover:bg-slate-800 transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
