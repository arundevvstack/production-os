import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, MapPin, Film, Aperture, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductionMetricsProps {
  project: any;
}

export function ProductionMetrics({ project }: ProductionMetricsProps) {
  const router = useRouter();
  
  if (!project || !project.counts) return null;

  const metrics = [
    { label: 'Characters', count: project.counts.characters || 0, icon: Users, path: 'characters', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Locations', count: project.counts.locations || 0, icon: MapPin, path: 'locations', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Scenes', count: project.counts.scenes || 0, icon: Film, path: 'scenes', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Shots', count: project.counts.shots || 0, icon: Aperture, path: 'shots', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Prompts', count: project.counts.prompts || 0, icon: MessageSquare, path: 'prompts', color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Assets', count: project.counts.assets || 0, icon: ImageIcon, path: 'assets', color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((m, idx) => (
        <Card 
          key={idx} 
          className="group cursor-pointer hover:shadow-premium transition-all duration-300 border-border hover:border-white/20 bg-secondary/30"
          onClick={() => router.push(`/projects/${project.id}/${m.path}`)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-foreground">{m.count}</p>
            </div>
            <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-transform group-hover:scale-110 ring-1 ring-white/5`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
