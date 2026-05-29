"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Play, Pause, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { companyId, user } = useTenant();

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!companyId || !projectId) return;

    const loadAssets = async () => {
      const { data } = await supabase
        .from('Asset')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      setAssets(data || []);
      if (data && data.length > 0) {
        setSelectedAsset(data[0]);
      }
    };
    loadAssets();
  }, [companyId, projectId]);

  useEffect(() => {
    if (!selectedAsset) return;

    const loadComments = async () => {
      const { data } = await supabase
        .from('Comment')
        .select('*, user:User(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
        
      // In a real app we'd link comments to assets, but currently Comment only links to Project/Objective.
      // We will filter based on content tag or just show project comments for now.
      setComments(data || []);
    };
    loadComments();
    
    // Subscribe to new comments
    const channel = supabase.channel('realtime_comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Comment', filter: `project_id=eq.${projectId}` }, (payload) => {
        setComments(prev => [...prev, payload.new]);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [selectedAsset, projectId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const jumpToTime = (timeStr: string) => {
    if (!timeStr || !videoRef.current) return;
    const [m, s] = timeStr.split(':').map(Number);
    const totalSeconds = (m * 60) + s;
    videoRef.current.currentTime = totalSeconds;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !companyId) return;

    const timestamp = formatTime(currentTime);
    const content = `[${timestamp}] ${newComment}`;

    const { error } = await supabase.from('Comment').insert({
      company_id: companyId,
      project_id: projectId,
      user_id: user.id,
      content,
      timestamp
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    setNewComment("");
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex h-screen bg-muted flex-col md:flex-row overflow-hidden">
      
      {/* LEFT: Video Player */}
      <div className="flex-1 flex flex-col relative h-[50vh] md:h-full border-r border-border">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="secondary" size="sm" onClick={() => router.back()} className="rounded-full shadow-lg bg-white/90 backdrop-blur-md">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workspace
          </Button>
        </div>

        {selectedAsset ? (
          <div className="flex-1 bg-black flex flex-col justify-center relative">
            <video
              ref={videoRef}
              src={selectedAsset.url}
              className="w-full max-h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={false}
              onClick={togglePlay}
            />
            
            {/* Custom Video Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-4">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full h-12 w-12" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <div className="text-white font-mono font-black text-xl drop-shadow-md">
                {formatTime(currentTime)}
              </div>
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                 <div 
                   className="h-full bg-primary" 
                   style={{ width: `${videoRef.current?.duration ? (currentTime / videoRef.current.duration) * 100 : 0}%` }} 
                 />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-muted flex items-center justify-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
            No assets available for review
          </div>
        )}
      </div>

      {/* RIGHT: Comments & Annotations */}
      <div className="w-full md:w-[400px] flex flex-col bg-white h-[50vh] md:h-full z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
        <div className="p-6 border-b border-border bg-muted/50 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-primary tracking-tight">Review & Annotate</h2>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Client Feedback Loop</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="rounded-full text-emerald-600 bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full text-accent bg-accent/10 border-accent/20">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                  {comment.user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-primary">{comment.user?.full_name || 'User'}</span>
                  {comment.timestamp && (
                    <Badge variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-[9px] bg-muted"
                      onClick={() => jumpToTime(comment.timestamp)}
                    >
                      <Clock className="h-3 w-3 mr-1" /> {comment.timestamp}
                    </Badge>
                  )}
                </div>
                <Card className="p-3 bg-muted border-border text-sm font-medium text-muted-foreground/80 rounded-2xl rounded-tl-none shadow-sm group-hover:shadow-md transition-shadow">
                  {comment.content.replace(`[${comment.timestamp}] `, '')}
                </Card>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-white">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment at current timestamp..." 
                className="h-12 rounded-full pl-12 bg-muted border-border font-medium pr-4"
              />
              <div className="absolute left-1 top-1 h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-full font-mono font-black text-xs">
                {formatTime(currentTime)}
              </div>
            </div>
            <Button type="submit" size="icon" className="h-12 w-12 rounded-full shadow-lg shadow-primary/20">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

    </div>
  );
}

// Temporary Badge component since we didn't import it at the top
function Badge({ children, className, ...props }: any) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props}>
      {children}
    </span>
  );
}
