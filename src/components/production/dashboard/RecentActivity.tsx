import React from 'react';
import { History, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <Card className="bg-secondary/30 shadow-premium border-border">
      <CardHeader className="py-4 border-b border-border">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {combined.length > 0 ? (
          <div className="divide-y divide-white/10">
            {combined.map((item, idx) => {
              const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              if (item.type === 'asset') {
                const url = item.data.Versions?.[0]?.file_url;
                return (
                  <div key={`asset-${item.data.id}-${idx}`} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${projectId}/assets`)}>
                    {url ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary shrink-0 border border-border">
                        <Image src={url} alt={item.data.name} width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-amber-500/20">
                        <ImageIcon className="w-5 h-5 text-amber-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">Asset Rendered</p>
                      <p className="text-xs text-muted-foreground truncate">{item.data.name}</p>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> {dateStr}</div>
                  </div>
                );
              } else {
                return (
                  <div key={`prompt-${item.data.id}-${idx}`} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${projectId}/prompts`)}>
                    <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-pink-500/20">
                      <MessageSquare className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">Prompt Generated</p>
                      <p className="text-xs text-muted-foreground truncate">{item.data.name}</p>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> {dateStr}</div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-3">
               <History className="w-5 h-5 text-muted-foreground" />
             </div>
             <p className="text-sm font-bold text-foreground mb-1">No Activity Yet</p>
             <p className="text-xs text-muted-foreground max-w-[200px] mb-4">Generate your first production asset to see it here.</p>
             <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/generation`)}>Generate Asset</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
