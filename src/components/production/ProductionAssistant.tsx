"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, MessageSquare, Loader2, Send, ChevronRight, Play } from "lucide-react";

export function ProductionAssistant({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const extractContextFromPath = () => {
    // Example: /projects/[id]/scenes/[sceneId]/shots/[shotId]
    const parts = pathname.split('/');
    const sceneIdx = parts.indexOf('scenes');
    const shotIdx = parts.indexOf('shots');
    const assetIdx = parts.indexOf('assets');

    return {
      sceneId: sceneIdx !== -1 ? parts[sceneIdx + 1] : null,
      shotId: shotIdx !== -1 ? parts[shotIdx + 1] : null,
      assetId: assetIdx !== -1 ? parts[assetIdx + 1] : null,
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const context = extractContextFromPath();

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          threadId,
          ...context
        })
      });

      if (!response.ok) throw new Error("Failed to send message");

      const returnedThreadId = response.headers.get('X-Thread-Id');
      if (returnedThreadId && !threadId) setThreadId(returnedThreadId);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let assistantMsg = "";
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // OpenRouter streams chunked SSE. We need to parse "data: {...}"
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const text = data.choices?.[0]?.delta?.content || "";
                assistantMsg += text;
                
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantMsg;
                  return newMsgs;
                });
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Minimal Action Parser
  const renderMessageContent = (content: string) => {
    // Look for {"action": "something"} at the end of the text
    const actionRegex = /\{"action":\s*"([^"]+)"\}/g;
    let text = content;
    const actions: string[] = [];
    
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push(match[1]);
      text = text.replace(match[0], '');
    }

    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{text.trim()}</div>
        {actions.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {actions.map((act, i) => (
              <button key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition w-fit">
                <Play className="h-3 w-3" />
                Execute: {act.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group"
      >
        <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white border-l shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Production Assistant
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10 space-y-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-slate-700">How can I help?</p>
              <p className="text-xs mt-1">I automatically understand your current scene and project context.</p>
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              {m.role === 'user' ? (
                <div className="text-sm">{m.content}</div>
              ) : (
                renderMessageContent(m.content)
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this project..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
