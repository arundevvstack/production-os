"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, FileText, CheckSquare, Download, Clock, ShieldAlert,
  ArrowRight, ShieldCheck, CheckCircle2, Lock, Eye, Check,
  MessageSquare, Send, File, Share2, LogOut, ArrowUpRight, PlayCircle, Film,
  UserCheck, AlertCircle, Phone, Mail, Sparkles, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTenant } from "@/hooks/use-tenant";

export default function ClientDashboardPage() {
  const { toast } = useToast();
  const { user, profile, isLoading, isSuperAdmin } = useTenant();

  // Auth Guard
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      window.location.href = "/client/login";
    } else if (profile?.status === 'suspended') {
      window.location.href = "/access-blocked";
    } else if (profile?.status === 'pending' && !isSuperAdmin) {
      window.location.href = "/pending-approval";
    } else if (profile?.role_id && profile?.role_id !== 'CLIENT' && !isSuperAdmin) {
      window.location.href = "/login";
    }
  }, [user, profile, isLoading, isSuperAdmin]);

  // Campaign Progress State
  const [campaignProgress, setCampaignProgress] = useState({
    name: "Summer Launch Campaign 2026",
    status: "Active Production",
    progressPercent: 75,
    budget: "₹8,50,000"
  });

  // Shortlisted Talents for Client Approval (Phase 6)
  const [talents, setTalents] = useState([
    { 
      id: "public_t1", 
      fullName: "Tovino Thomas", 
      category: "Actor", 
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500",
      shootDates: "2026-06-12 to 2026-06-15",
      bookingStatus: "Pending Approval",
      reelTitle: "Cinematic Showreel 2026",
      reelUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e330120d9e5e783ae91620d436e&profile_id=139&oauth2_token_id=57447761",
      privatePhone: "+91 98950 54321",
      privateEmail: "tovino@dpmedia.in",
      unlocked: false
    },
    { 
      id: "public_t2", 
      fullName: "Nimisha Sajayan", 
      category: "Actor", 
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
      shootDates: "2026-06-28",
      bookingStatus: "Approved",
      reelTitle: "Drama Monologue Reel",
      reelUrl: "https://player.vimeo.com/external/435674703.sd.mp4?s=7f3747ebc7cc93322f79fb5814523a9d20c3a502&profile_id=139&oauth2_token_id=57447761",
      privatePhone: "+91 98460 12345",
      privateEmail: "nimisha@dpmedia.in",
      unlocked: true
    }
  ]);

  // Secure In-App Chat Sessions (Phase 4)
  const [selectedTalentChat, setSelectedTalentChat] = useState<string>("public_t2");
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({
    "public_t1": [
      { id: 1, sender: "manager", text: "Hello! We received your booking request for Tovino. We are checking day rate fits now.", time: "10:30 AM" }
    ],
    "public_t2": [
      { id: 1, sender: "creator", text: "Hi! I saw the shoot schedule for Nimisha. Excited to proceed with the summer film.", time: "Yesterday" },
      { id: 2, sender: "manager", text: "Hi team, Nimisha is fully locked. We can align on wardrobe guidelines here.", time: "Yesterday" }
    ]
  });

  const [messageInput, setMessageInput] = useState("");
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([
    { id: "c_1", user: "Shyam Lal (Director)", text: "Rough cut uploaded. Please review actor expressions in the first 10 seconds.", time: "1 hour ago" }
  ]);

  // Client proposals (Phase 8)
  const [proposals, setProposals] = useState([
    { id: "prop_1", title: "CGI Ramp Video Proposal V2", amount: "₹3,50,000", date: "2026-05-18", status: "Approved" },
    { id: "prop_2", title: "Social Media Deliverables Add-on", amount: "₹1,20,000", date: "2026-05-19", status: "Pending Approval" }
  ]);

  // Client invoices (Phase 8)
  const [invoices, setInvoices] = useState([
    { id: "inv_1", number: "INV-2026-042", amount: "₹3,50,000", status: "Paid", date: "2026-05-15" },
    { id: "inv_2", number: "INV-2026-049", amount: "₹1,20,000", status: "Unpaid", date: "2026-06-30" }
  ]);

  // Shared deliverables (Phase 8)
  const [files, setFiles] = useState([
    { id: "f_1", name: "Main Campaign Film Rough Cut.mp4", size: "185 MB", date: "2026-05-19", status: "Pending Review" },
    { id: "f_2", name: "Instagram Story Cutdown 1.mp4", size: "24 MB", date: "2026-05-18", status: "Approved" }
  ]);

  const handleApproveTalent = (id: string, name: string) => {
    setTalents(prev => prev.map(t => {
      if (t.id === id) return { ...t, bookingStatus: "Approved" };
      return t;
    }));
    toast({
      title: "Talent Approved!",
      description: `"${name}" has been approved for campaign shoot.`
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setChatMessages(prev => ({
      ...prev,
      [selectedTalentChat]: [
        ...(prev[selectedTalentChat] || []),
        { id: Date.now(), sender: "client", text: messageInput, time: "Just Now" }
      ]
    }));
    setMessageInput("");
    
    toast({
      title: "Message Sent",
      description: "Delivered securely through DP Media Platform Layer."
    });
  };

  const handleRequestUpdate = () => {
    toast({
      title: "Update Requested",
      description: "Talent and manager notified. You will receive a response shortly."
    });
  };

  const handleApproveProposal = (id: string, title: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) return { ...p, status: "Approved" };
      return p;
    }));
    toast({
      title: "Proposal Approved",
      description: `Contract agreement locked for "${title}". Starting execution.`
    });
  };

  const handleApproveFile = (id: string, name: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) return { ...f, status: "Approved" };
      return f;
    }));
    toast({
      title: "Asset Approved",
      description: `Deliverable "${name}" marked as approved for campaign deployment.`
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setComments(prev => [
      ...prev,
      { id: `c_${comments.length + 1}`, user: "Client Partner (You)", text: commentInput, time: "Just Now" }
    ]);
    setCommentInput("");
  };

  // AI suggest details helper (Phase 10)
  const currentChatTalent = talents.find(t => t.id === selectedTalentChat);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased pb-20 selection:bg-destructive selection:text-white">
      
      {/* Clean Premium Apple Header */}
      <header className="border-b border-border/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-destructive/10 rounded-xl flex items-center justify-center font-black text-sm text-red-650 shadow-sm">DP</div>
            <div>
              <span className="font-bold text-base tracking-tight block text-primary">Define Perspective</span>
              <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none">Partner Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge className="bg-muted text-primary border-border px-3 py-1 font-bold text-[10px] uppercase rounded-full">
              Brand Representative
            </Badge>
            <Button onClick={() => window.location.href = "/client/login"} variant="ghost" className="rounded-full h-10 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted border border-border shadow-sm bg-white transition px-4 gap-1">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Campaign Summary */}
        <section className="lg:col-span-1 space-y-6">
          <Card className="bg-white border border-border shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active Campaign</span>
                <h2 className="text-xl font-bold text-primary leading-tight tracking-tight">{campaignProgress.name}</h2>
                <Badge className="bg-muted text-primary/80 border border-border font-bold text-[9px] py-1 px-3 mt-1 rounded-full">
                  {campaignProgress.status}
                </Badge>
              </div>

              {/* Progress Slider Display */}
              <div className="space-y-2.5 border-t border-border pt-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground font-medium">Production Progress</span>
                  <span className="text-primary font-black">{campaignProgress.progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${campaignProgress.progressPercent}%` }} />
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-border pt-4 font-bold font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Budget Value</span>
                  <strong className="text-primary">{campaignProgress.budget}</strong>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Secure Contact Unlock Indicators (Phase 5) */}
          <Card className="bg-white border border-border shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-850 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600 animate-pulse" /> Controlled Contact Unlock
              </h3>
              
              <div className="space-y-4">
                {talents.map(t => (
                  <div key={t.id} className="p-3 bg-muted border border-slate-150 rounded-2xl flex flex-col gap-2 font-bold text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-primary">{t.fullName}</span>
                      {t.unlocked ? (
                        <Badge className="bg-emerald-500/10 text-emerald-605 border-none text-[8px] rounded-full">Unlocked</Badge>
                      ) : (
                        <Badge className="bg-secondary text-muted-foreground border-none text-[8px] rounded-full">Locked</Badge>
                      )}
                    </div>

                    {t.unlocked ? (
                      <div className="space-y-1.5 pt-1 text-[10px] text-muted-foreground/80">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-red-650" /> {t.privatePhone}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-red-650" /> {t.privateEmail}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-405 font-medium leading-relaxed">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Contacts hidden until booking acceptance & manager review
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right Side Secure chat and Approvals */}
        <section className="lg:col-span-2 space-y-8">
          
          {/* SECURE IN-APP CHAT (Phase 4, 6) */}
          <Card className="bg-white border border-border shadow-sm rounded-3xl overflow-hidden">
            <div className="border-b border-border bg-muted/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-red-650" />
                <h3 className="font-bold text-sm text-primary">Secure Conversations</h3>
              </div>

              {/* Quick conversation switcher tab */}
              <div className="flex gap-2">
                {talents.map(t => (
                  <Button 
                    key={t.id}
                    onClick={() => setSelectedTalentChat(t.id)}
                    variant="ghost"
                    className={`rounded-full h-8 px-3 text-[10px] font-bold transition ${
                      selectedTalentChat === t.id ? "bg-white border border-border text-primary shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {t.fullName.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat Body & Bubble Layers */}
            <CardContent className="p-0 flex flex-col h-[320px]">
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#f8f9fa] scrollbar-thin">
                
                {/* AI Communication Assist Warning (Phase 10) */}
                {currentChatTalent?.bookingStatus !== "Approved" && (
                  <div className="p-3 bg-accent/5 border border-accent/10 rounded-2xl flex gap-2 text-[10px] text-accent leading-relaxed font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                    <div>
                      <span><strong>AI Assist Suggestion</strong>: Shoot location and schedule dates are not locked yet. Click "Confirm Shoot" below to align booking.</span>
                    </div>
                  </div>
                )}

                {(chatMessages[selectedTalentChat] || []).map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[70%] font-bold text-xs space-y-1 ${
                      msg.sender === "client" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[8px] text-muted-foreground uppercase tracking-widest">
                      {msg.sender === "client" ? "You" : currentChatTalent?.fullName.split(" ")[0] || "Manager"}
                    </span>
                    <div 
                      className={`p-3.5 rounded-2xl shadow-sm text-primary ${
                        msg.sender === "client" 
                          ? "bg-destructive text-white rounded-tr-none font-bold" 
                          : "bg-white border border-border rounded-tl-none font-bold"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-border flex gap-2">
                <Input 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type message securely..."
                  className="bg-muted border border-border h-10 text-xs rounded-xl flex-grow text-primary font-bold"
                />
                
                <Button 
                  onClick={handleRequestUpdate}
                  type="button" 
                  variant="ghost" 
                  className="rounded-xl h-10 border border-border text-muted-foreground font-bold text-[10px] px-3.5"
                >
                  Request Update
                </Button>

                <Button type="submit" className="rounded-xl h-10 bg-primary hover:bg-primary text-white font-bold px-4 shadow-sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Creator Casting & Approvals Section */}
          <Card className="bg-white border border-border shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Film className="h-4.5 w-4.5 text-red-650 animate-pulse" /> Casting Discovery & Approvals
              </h3>

              <div className="space-y-4">
                {talents.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-muted border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-white shadow-sm ring-2 ring-border shrink-0">
                        <AvatarImage src={t.avatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-secondary font-bold">{t.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-primary">{t.fullName}</h4>
                          <Badge className="bg-muted text-primary/80 border-none text-[8px] font-bold uppercase rounded-full">{t.category}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1">Shoot Dates: {t.shootDates}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Button 
                        onClick={() => setActiveVideoUrl(t.reelUrl)}
                        variant="outline" 
                        className="rounded-full h-8 px-4 text-[10px] font-bold border-border bg-white hover:bg-muted text-primary/80 shadow-sm gap-1"
                      >
                        <PlayCircle className="h-4 w-4 text-red-650" /> Watch Reel
                      </Button>

                      {t.bookingStatus !== "Approved" ? (
                        <Button 
                          onClick={() => handleApproveTalent(t.id, t.fullName)}
                          className="rounded-full h-8 px-4 text-[10px] font-bold bg-destructive hover:bg-destructive text-white shadow shadow-red-500/10 transition"
                        >
                          Approve Talent
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold rounded-full px-2.5 py-1">Approved</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Proposals & Work Contracts */}
          <Card className="bg-white border border-border shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-muted-foreground/80" /> Active Proposals & Work Contracts
              </h3>

              <div className="space-y-4">
                {proposals.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-muted border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-primary">{p.title}</h4>
                        <Badge className={`border-none text-[8px] font-bold rounded-full ${
                          p.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"
                        }`}>{p.status}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1.5">
                        Budget: {p.amount} | Date Issued: {p.date}
                      </p>
                    </div>

                    {p.status !== "Approved" && (
                      <Button 
                        onClick={() => handleApproveProposal(p.id, p.title)}
                        className="rounded-full h-8 px-4 text-[10px] font-bold bg-primary hover:bg-primary text-white shrink-0"
                      >
                        Approve Proposal
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </section>

      </main>

      {/* Video Reel Preview Modal */}
      <Dialog open={!!activeVideoUrl} onOpenChange={() => setActiveVideoUrl(null)}>
        <DialogContent className="bg-primary border-none p-0 max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl">
          {activeVideoUrl && (
            <video 
              src={activeVideoUrl} 
              className="w-full h-full object-cover" 
              controls 
              autoPlay
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
