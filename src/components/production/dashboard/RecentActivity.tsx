import React from 'react';
import { History, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RecentActivityProps {
  recentAssets: any[];
  recentPrompts: any[];
  projectId: string;
}

export function RecentActivity({ recentAssets, recentPrompts, projectId }: RecentActivityProps) {
  const router = useRouter();

  // Merge and sort
  const combined = [
    ...recentAssets.map(a => ({ type: 'asset', data: a, date: new Date(a.created_at).getTime() })),
    ...recentPrompts.map(p => ({ type: 'prompt', data: p, date: new Date(p.created_at).getTime() }))
  ].sort((a, b) => b.date - a.date).slice(0, 10);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="py-4 border-b border-slate-100">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {combined.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {combined.map((item, idx) => {
              const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              if (item.type === 'asset') {
                const url = item.data.Versions?.[0]?.file_url;
                return (
                  <div key={`asset-${item.data.id}-${idx}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${projectId}/assets`)}>
                    {url ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0 border">
                        <img src={url} alt={item.data.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                        <ImageIcon className="w-5 h-5 text-amber-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">Asset Rendered</p>
                      <p className="text-xs text-slate-500 truncate">{item.data.name}</p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> {dateStr}</div>
                  </div>
                );
              } else {
                return (
                  <div key={`prompt-${item.data.id}-${idx}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${projectId}/prompts`)}>
                    <div className="w-12 h-12 rounded-md bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100">
                      <MessageSquare className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">Prompt Generated</p>
                      <p className="text-xs text-slate-500 truncate">{item.data.name}</p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> {dateStr}</div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
               <History className="w-5 h-5 text-slate-300" />
             </div>
             <p className="text-sm font-bold text-slate-700 mb-1">No Activity Yet</p>
             <p className="text-xs text-slate-500 max-w-[200px] mb-4">Generate your first production asset to see it here.</p>
             <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/generation`)}>Generate Asset</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
