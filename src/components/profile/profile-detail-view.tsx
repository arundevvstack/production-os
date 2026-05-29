"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { supabase } from "@/supabase/client";
import { 
  Users, Mail, Phone, Building, MapPin, Calendar, CheckCircle2, 
  MessageSquare, Briefcase, CalendarClock, CheckSquare, Share2, 
  Download, Ban, Sparkles, Award, FileText, Lock, Plus, Trash2, 
  Clock, Check, Eye, AlertCircle, RefreshCw, Send, SendHorizontal, 
  ShieldAlert, BookOpen, Star, Instagram, ChevronRight, Play, Maximize2,
  FolderOpen
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProfileDetailViewProps {
  id: string;
  sourceRoute?: "profile" | "team" | "talent" | "client";
  onClose?: () => void;
}

export function ProfileDetailView({ id, sourceRoute = "profile", onClose }: ProfileDetailViewProps) {
  const { profile: currentProfile, roleId, hasPermission } = useTenant();
  const { toast } = useToast();

  // Profile data state
  const [loading, setLoading] = useState(true);
  const [profileType, setProfileType] = useState<"employee" | "talent" | "client">("employee");
  const [profileData, setProfileData] = useState<any>(null);

  // Status and Presence states
  const [status, setStatus] = useState<string>("Active");
  const [presence, setPresence] = useState<string>("online");

  // Interaction Modals states
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Forms states
  const [msgText, setMsgText] = useState("");
  const [assignProjectName, setAssignProjectName] = useState("");
  const [meetingSubject, setMeetingSubject] = useState("");
  const [meetingDate, setMeetingDate] = useState("2026-06-15");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("2026-06-20");

  // Live dynamic lists (Phase 3, 5, 6, 7)
  const [projects, setProjects] = useState<any[]>([
    { id: "p1", name: "BB App TVC Commercial", role: "Directing", status: "Active", deadline: "2026-06-30", budget: 1500000, progress: 65 },
    { id: "p2", name: "Kalyan Silks Digital Ads", role: "Post Production", status: "Active", deadline: "2026-07-15", budget: 600000, progress: 30 },
    { id: "p3", name: "Tech-Start Brand Shoot", role: "Key Production", status: "Completed", deadline: "2026-05-10", budget: 350000, progress: 100 }
  ]);

  const [tasks, setTasks] = useState<any[]>([
    { id: "t1", title: "Review rough cuts", status: "Pending", due: "2026-05-24" },
    { id: "t2", title: "Finalize color grading", status: "Pending", due: "2026-05-28" },
    { id: "t3", title: "Sign client nda release", status: "Completed", due: "2026-05-15" }
  ]);

  const [activities, setActivities] = useState<any[]>([
    { id: "act1", type: "task", desc: "Completed task 'Sign client nda release'", time: "2 hours ago" },
    { id: "act2", type: "project", desc: "Joined project 'Kalyan Silks Digital Ads'", time: "1 day ago" },
    { id: "act3", type: "meeting", desc: "Attended pre-production review session", time: "2 days ago" },
    { id: "act4", type: "invoice", desc: "Approved production advance voucher", time: "4 days ago" }
  ]);

  const [availabilityBlocks, setAvailabilityBlocks] = useState<any[]>([
    { id: "b1", date: "2026-06-05 to 2026-06-07", reason: "Out of Studio / Travel" },
    { id: "b2", date: "2026-06-12", reason: "Rehearsal Call" }
  ]);

  // Strict RBAC: normal employees must NEVER see finance details
  const canViewFinance = roleId === "SUPER_ADMIN" || roleId === "MANAGER" || roleId === "ACCOUNTS";

  // Fetch / Mock profile loading
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Enforce Talent route detection
        if (sourceRoute === "talent" || id.startsWith("talent_")) {
          // Attempt to find talent profile in database
          const { data: talentDoc } = await supabase
            .from("Talent")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (talentDoc) {
            setProfileType("talent");
            setProfileData({
              id: talentDoc.id,
              fullName: talentDoc.full_name,
              role: talentDoc.category,
              department: "Talent Roster",
              email: "agent@defineperspective.com",
              phone: "+91 98460 22110",
              company: "DP Talent Network",
              location: talentDoc.location || "Kochi, Kerala",
              joinDate: new Date(talentDoc.created_at).toLocaleDateString(),
              avatarUrl: talentDoc.portfolio_urls?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
              followers: talentDoc.followers,
              engagementRate: talentDoc.engagement_rate,
              portfolioUrls: talentDoc.portfolio_urls || [],
              dayRate: 95000,
              experience: "7+ Years Lead Actor / Model",
              languages: "Malayalam, English, Tamil",
              notes: "Highly expressive features, excellent for emotional scripts and cinematic traditional wear."
            });
            setStatus(talentDoc.is_public ? "Active" : "On Leave");
          } else {
            // Mock dynamic Talent fallback
            setProfileType("talent");
            setProfileData({
              id,
              fullName: "Nimisha Sajayan",
              role: "Actor / Model",
              department: "Talent Roster",
              email: "agent@defineperspective.com",
              phone: "+91 98460 22340",
              company: "DP Casting Agency",
              location: "Kochi, Kerala",
              joinDate: "Jan 12, 2025",
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
              followers: 1800000,
              engagementRate: 0.082,
              portfolioUrls: [
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=500",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500"
              ],
              dayRate: 150000,
              experience: "8+ Years Lead Performance",
              languages: "Malayalam, English, Tamil",
              notes: "Renowned Malayalam lead actor with exceptional realism and emotional performance."
            });
          }
        } 
        // Enforce Client route detection
        else if (sourceRoute === "client" || id.startsWith("client_")) {
          setProfileType("client");
          setProfileData({
            id,
            fullName: "Kalyan Silks (Retail)",
            role: "Corporate Client",
            department: "Brand Accounts",
            email: "marketing@kalyansilks.com",
            phone: "+91 487 242 1100",
            company: "Kalyan Silks Group",
            location: "Thrissur, Kerala",
            joinDate: "Mar 10, 2024",
            avatarUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=400&h=400",
            relationshipSummary: "Key retail clothing brand in South India. Active lead generator for wedding and digital commercials.",
            proposalsCount: 4,
            invoicesTotal: 2200000,
            activeProposals: [
              { num: "PROP-2026-08", title: "Wedding Silks TVC Phase 2", val: "₹1,200,000", status: "Approved" },
              { num: "PROP-2026-11", title: "Social Reels Campaign", val: "₹450,000", status: "Under Review" }
            ]
          });
        } 
        // Default: Employee / Manager Profile
        else {
          const { data: userDoc } = await supabase
            .from("User")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (userDoc) {
            setProfileType("employee");
            setProfileData({
              id: userDoc.id,
              fullName: userDoc.fullName,
              role: userDoc.role_id,
              department: userDoc.department || "Creative",
              email: userDoc.email,
              phone: "+91 97460 30040",
              company: "Define Perspective",
              location: "Kochi, Kerala",
              joinDate: new Date(userDoc.createdAt).toLocaleDateString(),
              avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400"
            });
            setStatus(userDoc.status === "approved" ? "Active" : userDoc.status === "suspended" ? "Suspended" : "Pending");
          } else {
            // Mock employee fallback
            setProfileType("employee");
            setProfileData({
              id,
              fullName: "Arundev V.",
              role: "SUPER_ADMIN",
              department: "Technology",
              email: "arundevv.com@gmail.com",
              phone: "+91 90610 80210",
              company: "Define Perspective",
              location: "Kochi, Kerala",
              joinDate: "May 11, 2024",
              avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400"
            });
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, sourceRoute]);

  // Actions handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;

    toast({
      title: "Message Sent",
      description: `Internal chat message successfully routed to ${profileData.fullName}.`
    });
    setMsgText("");
    setIsMessageOpen(false);
  };

  const handleAssignProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectName.trim()) return;

    const newProj = {
      id: `p_${Date.now()}`,
      name: assignProjectName,
      role: "Contributor",
      status: "Active",
      deadline: "2026-08-30",
      budget: 250000,
      progress: 0
    };

    setProjects(prev => [newProj, ...prev]);
    setActivities(prev => [
      { id: `act_${Date.now()}`, type: "project", desc: `Assigned project '${assignProjectName}'`, time: "Just now" },
      ...prev
    ]);

    toast({
      title: "Project Assignment Published",
      description: `${profileData.fullName} successfully linked to '${assignProjectName}'.`
    });

    setAssignProjectName("");
    setIsAssignOpen(false);
  };

  const handleRemoveProject = (projId: string, projName: string) => {
    setProjects(prev => prev.filter(p => p.id !== projId));
    setActivities(prev => [
      { id: `act_${Date.now()}`, type: "project", desc: `Removed from project '${projName}'`, time: "Just now" },
      ...prev
    ]);
    toast({
      title: "Assignment Removed",
      description: `Revoked project membership of '${projName}'.`
    });
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingSubject.trim()) return;

    setActivities(prev => [
      { id: `act_${Date.now()}`, type: "meeting", desc: `Meeting scheduled: ${meetingSubject} (Date: ${meetingDate})`, time: "Just now" },
      ...prev
    ]);

    toast({
      title: "Meeting Scheduled",
      description: `Production calendar invitation sent for '${meetingSubject}' on ${meetingDate}.`
    });

    setMeetingSubject("");
    setIsMeetingOpen(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask = {
      id: `t_${Date.now()}`,
      title: taskTitle,
      status: "Pending",
      due: taskDeadline
    };

    setTasks(prev => [newTask, ...prev]);
    setActivities(prev => [
      { id: `act_${Date.now()}`, type: "task", desc: `Assigned new task: ${taskTitle}`, time: "Just now" },
      ...prev
    ]);

    toast({
      title: "Task Assigned",
      description: `'${taskTitle}' added to active workload timeline.`
    });

    setTaskTitle("");
    setIsTaskOpen(false);
  };

  const handleBlockDates = (e: React.FormEvent) => {
    e.preventDefault();
    const range = "2026-06-25 to 2026-06-27";
    
    setAvailabilityBlocks(prev => [
      ...prev,
      { id: `b_${Date.now()}`, date: range, reason: "Blocked by Production Manager" }
    ]);

    toast({
      title: "Dates Blocked",
      description: `Locked shoot timeline range ${range} for ${profileData.fullName}.`
    });
  };

  const handleSuspendUser = async () => {
    setStatus("Suspended");
    
    // Save to database
    if (profileType === "employee") {
      await supabase.from("User").update({ status: "suspended" }).eq("id", id);
    } else if (profileType === "talent") {
      await supabase.from("Talent").update({ is_public: false }).eq("id", id);
    }

    toast({
      variant: "destructive",
      title: "Profile Suspended",
      description: `${profileData.fullName} status updated to Suspended. System permissions suspended.`
    });
  };

  const handleApproveUser = async () => {
    setStatus("Active");

    // Save to database
    if (profileType === "employee") {
      await supabase.from("User").update({ status: "approved" }).eq("id", id);
    } else if (profileType === "talent") {
      await supabase.from("Talent").update({ is_public: true }).eq("id", id);
    }

    toast({
      title: "Profile Activated",
      description: `${profileData.fullName} credentials cleared. Permissions active.`
    });
  };

  const handleDownload = () => {
    toast({
      title: "Export Commenced",
      description: "Generating secure PDF resume and credential export dossier..."
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Profile access token mapped to clipboard for messaging."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ----------------------------------------------------
          PHASE 1: DYNAMIC HEADER CARD (Premium Glassmorphism)
          ---------------------------------------------------- */}
      <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl overflow-hidden rounded-[16px] relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Live presence indicator (Phase 14) */}
          <div className="flex items-center gap-1.5 bg-primary/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <span className={`h-2 w-2 rounded-full animate-pulse ${
              presence === "online" ? "bg-emerald-500" : presence === "busy" ? "bg-accent" : "bg-slate-400"
            }`} />
            <select 
              value={presence} 
              onChange={(e) => setPresence(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-white uppercase focus:outline-none cursor-pointer"
            >
              <option value="online" className="text-foreground">Online</option>
              <option value="busy" className="text-foreground">In Meeting</option>
              <option value="shoot" className="text-foreground">On Shoot</option>
              <option value="offline" className="text-foreground">Offline</option>
            </select>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 rounded-2xl ring-4 ring-white/50 shadow-xl shrink-0 object-cover bg-muted">
              <AvatarImage src={profileData.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-black">{profileData.fullName?.substring(0, 2)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-none">{profileData.fullName}</h1>
                <Badge className="bg-primary text-white border-none font-bold text-[10px] py-0.5 px-2 rounded-md">{profileData.role}</Badge>
                <Badge className={`font-bold text-[10px] py-0.5 px-2 rounded-md border-none ${
                  status === "Active" ? "bg-emerald-500/10 text-emerald-600" : status === "Suspended" ? "bg-accent/10 text-accent" : "bg-accent/10 text-accent"
                }`}>
                  {status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                {profileData.department} &bull; {profileData.company}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-[11px] font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-foreground" />
                  <span className="truncate">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-foreground" />
                  <span>{profileData.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-foreground" />
                  <span>{profileData.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-foreground" />
                  <span>Joined: {profileData.joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------
              QUICK ACTIONS PIPELINE (Phase 1)
              ---------------------------------------------------- */}
          <div className="border-t border-white/20 mt-6 pt-6 flex flex-wrap gap-2">
            <Button onClick={() => setIsMessageOpen(true)} className="rounded-xl h-10 px-4 text-xs font-bold bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
              <MessageSquare className="h-4 w-4 mr-1.5" /> Message
            </Button>
            
            {(roleId === "SUPER_ADMIN" || roleId === "MANAGER") && (
              <>
                <Button onClick={() => setIsAssignOpen(true)} variant="outline" className="rounded-xl h-10 px-4 text-xs font-bold border-white/40 bg-white/20 hover:bg-muted text-foreground/80">
                  <Briefcase className="h-4 w-4 mr-1.5 text-emerald-500" /> Assign Project
                </Button>
                <Button onClick={() => setIsMeetingOpen(true)} variant="outline" className="rounded-xl h-10 px-4 text-xs font-bold border-white/40 bg-white/20 hover:bg-muted text-foreground/80">
                  <CalendarClock className="h-4 w-4 mr-1.5 text-accent" /> Schedule Meeting
                </Button>
                <Button onClick={() => setIsTaskOpen(true)} variant="outline" className="rounded-xl h-10 px-4 text-xs font-bold border-white/40 bg-white/20 hover:bg-muted text-foreground/80">
                  <CheckSquare className="h-4 w-4 mr-1.5 text-accent" /> Add Task
                </Button>
              </>
            )}

            <Button onClick={handleShare} variant="outline" className="rounded-xl h-10 px-4 text-xs font-bold border-white/40 bg-white/20 hover:bg-muted text-foreground/80">
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
            
            <Button onClick={handleDownload} variant="outline" className="rounded-xl h-10 px-4 text-xs font-bold border-white/40 bg-white/20 hover:bg-muted text-foreground/80">
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>

            {/* Strict RBAC Access Controls (Phase 11) */}
            {(roleId === "SUPER_ADMIN" || roleId === "MANAGER") && (
              <div className="flex gap-2 ml-auto">
                {status === "Active" ? (
                  <Button onClick={handleSuspendUser} variant="secondary" className="rounded-xl h-10 px-4 text-xs font-bold bg-accent/10 hover:bg-accent/20 text-accent border-none">
                    <Ban className="h-4 w-4 mr-1.5" /> Suspend Account
                  </Button>
                ) : (
                  <Button onClick={handleApproveUser} variant="secondary" className="rounded-xl h-10 px-4 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-none">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Account
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------
          TAB SYSTEM NAVIGATION
          ---------------------------------------------------- */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 rounded-xl bg-white/50 border border-white/20 p-1 mb-6 shadow-sm overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Overview</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Projects</TabsTrigger>
          {profileType === "talent" && (
            <TabsTrigger value="talent" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Talent Details</TabsTrigger>
          )}
          <TabsTrigger value="activity" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Activity</TabsTrigger>
          <TabsTrigger value="scheduling" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Schedule</TabsTrigger>
          {canViewFinance && (
            <TabsTrigger value="finance" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Finance</TabsTrigger>
          )}
          <TabsTrigger value="skills" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Skills & Bio</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4">Documents</TabsTrigger>
          <TabsTrigger value="ai_insights" className="rounded-lg text-[10px] md:text-xs font-bold py-2 px-4 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-accent" /> AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------
            PHASE 2: OVERVIEW SECTION TAB
            ---------------------------------------------------- */}
        <TabsContent value="overview" className="space-y-6">
          {profileType === "client" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-black text-sm text-foreground">Relationship Summary</h3>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
                      {profileData.relationshipSummary}
                    </p>
                  </CardContent>
                </Card>

                {/* Proposals History */}
                <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-black text-sm text-foreground">Proposals Overview</h3>
                    <div className="space-y-3">
                      {profileData.activeProposals?.map((prop: any, index: number) => (
                        <div key={index} className="flex justify-between p-3 bg-white/30 rounded-xl border border-white/10 text-xs items-center">
                          <div>
                            <strong className="text-foreground font-bold block">{prop.title}</strong>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{prop.num}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-foreground block">{prop.val}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold mt-1 text-[8px]">{prop.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider">Account Metrics</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-muted-foreground">Total Proposals Submitted</span>
                        <strong className="text-foreground">{profileData.proposalsCount}</strong>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold text-muted-foreground">Invoiced Revenue</span>
                        <strong className="text-foreground font-black">₹{profileData.invoicesTotal?.toLocaleString()}</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left overview widgets: work breakdown */}
            <div className="xl:col-span-2 space-y-6">
              <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-black text-sm text-foreground">Biographical Summary</h3>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    {profileType === "talent" ? profileData.notes : 
                     "Highly motivated digital creator specializing in commercial video production, color grading pipelines, and cross-platform video workflows. Over 4 years of proven capability inside the Malayalam advertising ecosystem."
                    }
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Productivity Score</span>
                      <strong className="text-xl font-black text-foreground block mt-1">94.2%</strong>
                      <Progress value={94.2} className="h-1.5 mt-2 bg-muted" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Workload Index</span>
                      <strong className="text-xl font-black text-foreground block mt-1">82.0%</strong>
                      <span className="text-[9px] font-bold text-accent mt-1 block">Near Capacity</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Approved Deliverables</span>
                      <strong className="text-xl font-black text-foreground block mt-1">26 cleared</strong>
                      <span className="text-[9px] font-bold text-emerald-500 mt-1 block">&bull; 0 delays</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks & Deadlines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider">Active Tasks</h4>
                    <div className="space-y-2">
                      {tasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-white/30 rounded-xl border border-white/10 text-xs">
                          <span className={t.status === "Completed" ? "line-through text-muted-foreground font-bold" : "text-foreground/80 font-bold"}>
                            {t.title}
                          </span>
                          <Badge className={`${
                            t.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"
                          } border-none text-[9px] font-black`}>
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider">Upcoming Deadlines</h4>
                    <div className="space-y-3">
                      {projects.filter(p => p.status === "Active").map(p => (
                        <div key={p.id} className="text-xs space-y-1.5">
                          <div className="flex justify-between font-bold text-foreground/80">
                            <span>{p.name}</span>
                            <span className="text-muted-foreground font-medium">{p.deadline}</span>
                          </div>
                          <Progress value={p.progress} className="h-1 bg-muted" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Overview sidebar widgets */}
            <div className="space-y-6">
              <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                <CardContent className="p-5 space-y-4">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider">Assigned Departments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["Creative Studio", "Media Design", "Kochi Center"].map(d => (
                      <Badge key={d} variant="secondary" className="bg-white/60 text-foreground/80 font-bold text-[10px] px-2 py-1 border border-white/20">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                <CardContent className="p-5 space-y-4">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider">Attendance Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-white/30 rounded-xl border border-white/10">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold">This Month</span>
                      <strong className="text-lg font-black text-foreground block mt-1">98%</strong>
                    </div>
                    <div className="p-3 bg-white/30 rounded-xl border border-white/10">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold">Leave Taken</span>
                      <strong className="text-lg font-black text-foreground block mt-1">1.5 Days</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
          )}
        </TabsContent>

        {/* ----------------------------------------------------
            PHASE 5: PERFORMANCE & ACTIVITY TIMELINE TAB
            ---------------------------------------------------- */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-black text-sm text-foreground">Operational Log Feed</h3>
              
              <div className="relative border-l border-white/30 ml-3 pl-6 space-y-6 text-xs">
                {activities.map((a) => (
                  <div key={a.id} className="relative">
                    <span className="absolute -left-[30px] top-0 h-4.5 w-4.5 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                    </span>
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{a.desc}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------
            PHASE 6: CALENDAR TIMELINE & AVAILABILITY
            ---------------------------------------------------- */}
        <TabsContent value="scheduling" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-sm text-foreground">Availability Calendars</h3>
              <p className="text-[10px] text-muted-foreground">Shoot dates, blocked days, and active production schedule overlaps.</p>
            </div>
            {(roleId === "SUPER_ADMIN" || roleId === "MANAGER") && (
              <Button onClick={handleBlockDates} variant="secondary" className="rounded-xl h-9 text-xs bg-muted hover:bg-secondary text-foreground/80 font-bold px-4">
                <Lock className="h-4 w-4 mr-1.5 text-foreground" /> Block Travel / Leave Dates
              </Button>
            )}
          </div>

          <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 text-xs">
                {availabilityBlocks.map((b) => (
                  <div key={b.id} className="flex justify-between p-3 bg-white/30 rounded-xl border border-white/10 items-center">
                    <div>
                      <strong className="text-foreground font-bold block">{b.date}</strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{b.reason}</span>
                    </div>
                    <Badge className="bg-accent/10 text-accent border-none font-bold">Blocked</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------
            PHASE 7: FINANCE & LEDGER PAYMENTS (Strict RBAC Gated)
            ---------------------------------------------------- */}
        {canViewFinance && (
          <TabsContent value="finance" className="space-y-4">
            <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-black text-sm text-foreground">Financial Ledger Overview</h3>
                  <p className="text-[10px] text-muted-foreground">Historical salary, milestone payouts, and freelancer invoice ledger logs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-white/30 rounded-xl border border-white/10 text-xs">
                    <span className="text-[10px] text-muted-foreground block font-bold">Salary / Day Rate</span>
                    <strong className="text-lg font-black text-foreground block mt-1">₹1,20,000 / month</strong>
                  </div>
                  <div className="p-4 bg-white/30 rounded-xl border border-white/10 text-xs">
                    <span className="text-[10px] text-muted-foreground block font-bold">Total Disbursed (2026)</span>
                    <strong className="text-lg font-black text-foreground block mt-1">₹4,80,000</strong>
                  </div>
                  <div className="p-4 bg-white/30 rounded-xl border border-white/10 text-xs">
                    <span className="text-[10px] text-muted-foreground block font-bold">Pending Milestone Pay</span>
                    <strong className="text-lg font-black text-foreground block mt-1">₹85,000</strong>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex justify-between items-center p-3 bg-white/30 rounded-xl border border-white/10">
                    <div>
                      <strong className="text-foreground font-bold block">Reimbursement Voucher (Travel)</strong>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Reference ID: EXP-9921 | Date: 2026-05-02</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-foreground block font-bold">₹12,450</strong>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold mt-1 text-[8px]">Cleared</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 rounded-xl border border-white/10">
                    <div>
                      <strong className="text-foreground font-bold block">Production Milestone Payout</strong>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Reference ID: PAY-0081 | Date: 2026-04-10</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-foreground block font-bold">₹75,000</strong>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold mt-1 text-[8px]">Cleared</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ----------------------------------------------------
            PHASE 8: SKILLS & EXPERIENCE BIOGRAPHY
            ---------------------------------------------------- */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-foreground" /> Skills & Progress
                </h3>
                <div className="space-y-4 pt-2">
                  {[
                    { name: "DaVinci Resolve Color Grading", val: 92 },
                    { name: "Cinematography Direction", val: 85 },
                    { name: "Live Production Auditing", val: 78 }
                  ].map((s) => (
                    <div key={s.name} className="text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-foreground/80">
                        <span>{s.name}</span>
                        <span>{s.val}%</span>
                      </div>
                      <Progress value={s.val} className="h-2 bg-muted" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-accent" /> Credentials & Tools
                </h3>
                
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Software Knowledge</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Premiere Pro", "DaVinci Resolve Studio", "Avid", "Adobe After Effects"].map(s => (
                        <Badge key={s} variant="secondary" className="bg-white/50 text-foreground/80 font-bold">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Certifications</span>
                    <p className="font-bold text-foreground/80 mt-1.5">Adobe Certified Professional &bull; Colorist Guild Certified</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ----------------------------------------------------
            PHASE 9: DOCUMENTS & MEDIA GALLERY
            ---------------------------------------------------- */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-foreground" /> Documents Vault
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 bg-white/30 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-8 w-8 text-foreground shrink-0" />
                    <div>
                      <strong className="text-foreground font-bold block">Production Contract Agreement.pdf</strong>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Signed Electronic Seal &bull; Size: 1.2MB</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 bg-white/30 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-8 w-8 text-accent shrink-0" />
                    <div>
                      <strong className="text-foreground font-bold block">Professional Identity Proof & Tax ID.pdf</strong>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Verified &bull; Size: 840KB</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------
            PHASE 10: AI COGNITIVE PROFILE INSIGHTS TAB
            ---------------------------------------------------- */}
        <TabsContent value="ai_insights" className="space-y-6">
          <Card className="glass-panel border-white/20 shadow-premium bg-gradient-to-br from-indigo-50/15 to-purple-50/15 backdrop-blur-3xl rounded-[12px] border-l-4 border-l-indigo-400">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-black text-sm text-accent flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" /> AI Workspace Diagnostics
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">AI engine analysis based on historical workload index, productivity timelines, and schedule conflicts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
                <div className="space-y-3.5">
                  <div className="p-3 bg-white/30 rounded-xl border border-accent/20/20">
                    <span className="font-bold text-accent block">Performance & Productivity Trends</span>
                    <p className="text-muted-foreground/80 mt-1 leading-relaxed">Productivity has spiked by 12% following Davinci Colorist Guild credentialing. Average turnaround for media grading deadlines is currently 1.2 days ahead of schedule.</p>
                  </div>
                  
                  <div className="p-3 bg-white/30 rounded-xl border border-accent/20/20">
                    <span className="font-bold text-accent block">Workload Balancer Suggestions</span>
                    <p className="text-muted-foreground/80 mt-1 leading-relaxed">Workload score (82%) indicates potential exhaustion if assigned to two consecutive large TVC projects. Suggest delegating minor reels editing tasks to a secondary freelancer.</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3 bg-white/30 rounded-xl border border-accent/20/20">
                    <span className="font-bold text-accent block">Project Alignment Match</span>
                    <p className="text-muted-foreground/80 mt-1 leading-relaxed">Highly suitable for premium digital lookbook designs. Match rate for upcoming Kalyan Silks Wedding shoot is 95% compatibility.</p>
                  </div>

                  <div className="p-3 bg-white/30 rounded-xl border border-accent/20/20">
                    <span className="font-bold text-accent block">Conflict Warning Diagnostics</span>
                    <p className="text-muted-foreground/80 mt-1 leading-relaxed">No direct overlapping shoot conflicts found. Travel dates (June 5-7) successfully registered to scheduling calendar, preempting minor shoot clashes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ----------------------------------------------------
          INTERACTIVE QUICK DIALOGS
          ---------------------------------------------------- */}
      {/* Send Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[12px] bg-white border border-white/20 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-foreground" /> Send Message
            </DialogTitle>
            <DialogDescription>
              Write a message to {profileData.fullName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4 py-2">
            <Textarea 
              placeholder="Type message here..." 
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              required
              className="rounded-xl border-white/40 h-24 text-xs"
            />
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Project Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[12px] bg-white border border-white/20 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black flex items-center gap-1.5">
              <Briefcase className="h-5 w-5 text-foreground" /> Assign Project
            </DialogTitle>
            <DialogDescription>
              Assign {profileData.fullName} to an active production pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignProject} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ap_name" className="text-xs font-bold text-muted-foreground/80">Choose Project</Label>
              <Input 
                id="ap_name"
                placeholder="e.g. BB App TVC Commercial" 
                value={assignProjectName}
                onChange={(e) => setAssignProjectName(e.target.value)}
                required
                className="rounded-xl border-white/40 h-10 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                Assign Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[12px] bg-white border border-white/20 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black flex items-center gap-1.5">
              <CalendarClock className="h-5 w-5 text-foreground" /> Schedule Meeting
            </DialogTitle>
            <DialogDescription>
              Schedule a new crew review meeting with {profileData.fullName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleMeeting} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="m_sub" className="text-xs font-bold text-muted-foreground/80">Meeting Subject</Label>
              <Input 
                id="m_sub"
                placeholder="e.g. Color Grading Review" 
                value={meetingSubject}
                onChange={(e) => setMeetingSubject(e.target.value)}
                required
                className="rounded-xl border-white/40 h-10 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m_date" className="text-xs font-bold text-muted-foreground/80">Date</Label>
              <Input 
                id="m_date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="rounded-xl border-white/40 h-10 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                Schedule Meeting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[12px] bg-white border border-white/20 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black flex items-center gap-1.5">
              <CheckSquare className="h-5 w-5 text-foreground" /> Add Task
            </DialogTitle>
            <DialogDescription>
              Add a new actionable milestone to {profileData.fullName}'s worklist.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="t_title" className="text-xs font-bold text-muted-foreground/80">Task Title</Label>
              <Input 
                id="t_title"
                placeholder="e.g. Review color grading cuts" 
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="rounded-xl border-white/40 h-10 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t_due" className="text-xs font-bold text-muted-foreground/80">Deadline</Label>
              <Input 
                id="t_due"
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="rounded-xl border-white/40 h-10 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern gallery lightbox dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-[650px] p-0 overflow-hidden bg-primary border-none rounded-[16px] shadow-2xl">
          <div className="relative aspect-square w-full">
            {selectedMediaUrl && (
              <img src={selectedMediaUrl} alt="Lookbook Expanded View" className="object-contain h-full w-full" />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs bg-primary/80 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <span className="font-bold">{profileData.fullName} Lookbook Portfolio Item</span>
              <a href={selectedMediaUrl || ""} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold hover:underline">
                <Maximize2 className="h-4 w-4" /> Open Original
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
