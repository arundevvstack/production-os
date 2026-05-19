"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Calendar as CalendarIcon, MessageCircle, DollarSign, MapPin, Instagram, 
  Youtube, Plus, Trash2, ArrowRight, ShieldCheck, CheckCircle2, Lock, 
  Eye, Edit3, Image as ImageIcon, Send, Film, Clock, LogOut, Award,
  CheckCircle, ShieldAlert, BarChart3, TrendingUp, Sparkle, Shield, AlertCircle, FileText,
  Facebook
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function TalentDashboardPage() {
  const { toast } = useToast();
  
  // Roster details state
  const [profileData, setProfileData] = useState({
    fullName: "Tovino Thomas",
    stageName: "Tovino",
    category: "Actor",
    dayRate: "350000",
    location: "Kochi, Kerala",
    availability: "Available",
    bio: "Leading South Indian actor known for intense dramatic performance and high-octane physical roles.",
    languages: "Malayalam, English, Tamil",
    reach: "7800000",
    engagementRate: "8.2%",
    height: "185 cm",
    weight: "78 kg",
    chest: "40 in",
    waist: "32 in",
    hip: "38 in",
    shoeSize: "10 US",
    hairColor: "Black",
    skinTone: "Wheatish",
    tattoos: "None",
    comfortable: ["TV Commercials", "Fashion Shoots", "Corporate Ads", "Comedy Content", "Travel Videos", "Couple Shoots", "Brand Collaborations"],
    uncomfortable: ["Smoking Scenes", "Alcohol Promotions", "Political Campaigns", "Intimate Scenes", "Late Night Shoots"],
    reel1Title: "Showreel 1",
    reel1Duration: "2:30",
    reel1Url: "https://www.w3schools.com/html/mov_bbb.mp4",
    reel2Title: "Showreel 2",
    reel2Duration: "1:30",
    reel2Url: "https://www.w3schools.com/html/movie.mp4",
    galleryUrls: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500",
    instagram: "https://instagram.com/tovino",
    youtube: "https://youtube.com/tovino",
    linkedin: "https://linkedin.com/in/tovino",
    facebook: "https://facebook.com/tovino"
  });

  // Load initial profileData from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("talent_profile_public_t1");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfileData(prev => ({
            ...prev,
            ...parsed
          }));
        } catch (e) {
          console.error("Failed to parse stored profileData", e);
        }
      }
    }
  }, []);

  // Creator Privacy Settings (Phase 5)
  const [privacySettings, setPrivacySettings] = useState<string[]>([
    "Show WhatsApp After Approval",
    "Platform Chat Only"
  ]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [tempData, setTempData] = useState({ ...profileData });

  // Sync tempData and reset wizard when modal opens
  useEffect(() => {
    if (isEditOpen) {
      setTempData({ ...profileData });
      setWizardStep(1);
    }
  }, [isEditOpen, profileData]);

  // Sandbox Inquiries (Phase 2)
  const [inquiries, setInquiries] = useState([
    { id: "inq_1", client: "Pulse Drinks", project: "Pulse Energy Drink TV Ad", days: 3, budget: "₹10,50,000", date: "2026-06-12", status: "Review", time: "2 hours ago" },
    { id: "inq_2", client: "Federal Bank", project: "Festival Commercial Shoot", days: 1, budget: "₹3,50,000", date: "2026-06-28", status: "Approved", time: "Yesterday" }
  ]);

  // Secure Chat Sessions (Phase 4, 7)
  const [selectedChatId, setSelectedChatId] = useState<string>("inq_2");
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({
    "inq_1": [
      { id: 1, sender: "client", text: "Hi Tovino! We would love to cast you as the main lead for our upcoming energy drink TV ad. Please let us know if your day rate works for this shoot.", time: "10:30 AM" }
    ],
    "inq_2": [
      { id: 1, sender: "client", text: "Hi! Nimisha's calendar is free for these dates. We are ready to sign the contract.", time: "Yesterday" },
      { id: 2, sender: "manager", text: "Approved by manager. Chat is open to organize the shoot.", time: "Yesterday" }
    ]
  });

  const [chatInput, setChatInput] = useState("");

  // Sandbox Bookings Calendar
  const [bookings, setBookings] = useState([
    { id: "bk_1", project: "BB App TVC Commercial", role: "Lead Hero", shootDates: "2026-06-12 to 2026-06-15", status: "Confirmed" }
  ]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData({ ...tempData });
    if (typeof window !== "undefined") {
      localStorage.setItem("talent_profile_public_t1", JSON.stringify(tempData));
    }
    setIsEditOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your portfolio details have been successfully synchronized.",
    });
  };

  const handleInquiryAccept = (id: string, client: string) => {
    setInquiries(prev => prev.map(inq => {
      if (inq.id === id) return { ...inq, status: "Approved" };
      return inq;
    }));
    toast({
      title: "Offer Accepted",
      description: `Inquiry from ${client} accepted. Schedule synchronized.`
    });
  };

  const handleInquiryReject = (id: string, client: string) => {
    setInquiries(prev => prev.filter(inq => inq.id !== id));
    toast({
      title: "Offer Declined",
      description: `Casting request from "${client}" declined.`
    });
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => ({
      ...prev,
      [selectedChatId]: [
        ...(prev[selectedChatId] || []),
        { id: Date.now(), sender: "creator", text: chatInput, time: "Just Now" }
      ]
    }));
    setChatInput("");
    toast({
      title: "Message Sent",
      description: "Secure operational communication log updated."
    });
  };

  const handlePrivacyToggle = (setting: string) => {
    setPrivacySettings(prev => {
      const isChecked = prev.includes(setting);
      const next = isChecked ? prev.filter(s => s !== setting) : [...prev, setting];
      toast({
        title: isChecked ? "Privacy Settings Updated" : "Privacy Settings Updated",
        description: `Setting "${setting}" has been ${isChecked ? "disabled" : "enabled"}.`
      });
      return next;
    });
  };

  const currentChatInquiry = inquiries.find(inq => inq.id === selectedChatId);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased pb-20 selection:bg-red-500 selection:text-white">
      
      {/* Platform Header */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center font-black text-sm text-red-650 shadow-sm shrink-0">DP</div>
            <div>
              <span className="font-bold text-base tracking-tight block text-slate-900">Creator Network</span>
              <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest leading-none">Creator Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="/creators/public_t1" target="_blank">
              <Button className="rounded-full h-10 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold gap-1 shadow-sm transition">
                <Eye className="h-4 w-4" /> View Public Page
              </Button>
            </a>
            <Button onClick={() => window.location.href = "/talent/login"} variant="ghost" className="rounded-full h-10 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm bg-white transition gap-1 px-4">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Profile Card */}
        <section className="lg:col-span-1 space-y-6">
          <Card className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-6">
              
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md ring-4 ring-slate-100">
                  <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500" className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-900 font-bold">{profileData.fullName[0]}</AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{profileData.fullName}</h2>
                    <Badge className="bg-red-500/10 text-red-650 border-none text-[8px] font-bold uppercase py-0.5 px-2 rounded-full">Premium</Badge>
                  </div>
                  <span className="text-xs text-red-600 font-bold tracking-widest uppercase">{profileData.category}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <MapPin className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                  <span>{profileData.location}</span>
                </div>
              </div>

              {/* Day rate info */}
              <div className="border-t border-b border-slate-150 py-4 space-y-3 text-xs text-slate-650 font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Day Rate</span>
                  <strong className="text-slate-950">₹{parseFloat(profileData.dayRate).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Calendar Status</span>
                  <Badge className={profileData.availability === "Available" ? "bg-emerald-500/10 text-emerald-600 border-none rounded-full" : "bg-amber-500/10 text-amber-600 border-none rounded-full"}>
                    {profileData.availability}
                  </Badge>
                </div>
              </div>

              <Button 
                onClick={() => {
                  setTempData({ ...profileData });
                  setIsEditOpen(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow shadow-red-500/10 transition"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile Details
              </Button>

            </CardContent>
          </Card>

          {/* Secure Creator Privacy Settings (Phase 5) */}
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-red-650" /> Creator Privacy Settings
              </h3>
              
              <div className="space-y-2 text-xs font-bold text-slate-750">
                {[
                  "Platform Chat Only",
                  "Verified Clients Only",
                  "Show WhatsApp After Approval",
                  "Hide Personal Contact"
                ].map(setting => (
                  <label key={setting} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
                    <input 
                      type="checkbox" 
                      checked={privacySettings.includes(setting)}
                      onChange={() => handlePrivacyToggle(setting)}
                      className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                    />
                    {setting}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right Side Bookings & Inquiries */}
        <section className="lg:col-span-2 space-y-8">
          
          {/* SECURE IN-APP CHAT (Phase 4, 7) */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4.5 w-4.5 text-red-650" />
                <h3 className="font-bold text-sm text-slate-900">Client secure chat</h3>
              </div>

              {/* Chat tab switcher */}
              <div className="flex gap-2">
                {inquiries.map(inq => (
                  <Button 
                    key={inq.id}
                    onClick={() => setSelectedChatId(inq.id)}
                    variant="ghost"
                    className={`rounded-full h-8 px-3 text-[10px] font-bold transition ${
                      selectedChatId === inq.id ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    {inq.client.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <CardContent className="p-0 flex flex-col h-[300px]">
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#f8f9fa] scrollbar-thin">
                
                {/* Secure chat warning locks */}
                {currentChatInquiry?.status !== "Approved" && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-2 text-[10px] text-amber-700 leading-relaxed font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span><strong>Secure Notice</strong>: Direct contacts are locked until you accept the collaboration request and the manager approves. Use Platform Chat to coordinate.</span>
                    </div>
                  </div>
                )}

                {(chatMessages[selectedChatId] || []).map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[70%] font-bold text-xs space-y-1 ${
                      msg.sender === "creator" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest">
                      {msg.sender === "creator" ? "You" : currentChatInquiry?.client.split(" ")[0]}
                    </span>
                    <div 
                      className={`p-3.5 rounded-2xl shadow-sm text-slate-800 ${
                        msg.sender === "creator" 
                          ? "bg-red-650 text-white rounded-tr-none font-bold" 
                          : "bg-white border border-slate-200 rounded-tl-none font-bold"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Reply securely..."
                  className="bg-slate-50 border border-slate-200 h-10 text-xs rounded-xl flex-grow text-slate-900 font-bold"
                />

                <Button type="submit" className="rounded-xl h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 shadow-sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* New Booking Requests */}
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <MessageCircle className="h-4.5 w-4.5 text-red-650" /> New Booking Requests
              </h3>

              <div className="space-y-4">
                {inquiries.map(inq => (
                  <div key={inq.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900">{inq.client}</h4>
                        <Badge className={`border-none text-[8px] font-bold rounded-full px-2 py-0.5 ${
                          inq.status === "Approved" ? "bg-emerald-500/10 text-emerald-605" : "bg-red-500/10 text-red-650"
                        }`}>{inq.status}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-550 font-bold mt-1.5">
                        Project: {inq.project} | Duration: {inq.days} Shoot Days | Target: {inq.date}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <div className="text-[10px] text-slate-500 font-bold">
                        Proposed Budget: <strong className="text-slate-950 font-black">{inq.budget}</strong>
                      </div>
                      
                      {inq.status !== "Approved" ? (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleInquiryReject(inq.id, inq.client)}
                            variant="ghost"
                            className="rounded-full h-8 px-3.5 text-[10px] font-bold text-slate-500 hover:text-slate-950 border border-slate-200 bg-white"
                          >
                            Decline
                          </Button>
                          <Button 
                            onClick={() => handleInquiryAccept(inq.id, inq.client)}
                            className="rounded-full h-8 px-4 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white shadow shadow-red-500/10 transition"
                          >
                            Accept Offer
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-650 font-bold text-xs">
                          <CheckCircle2 className="h-4.5 w-4.5" /> Booked & Scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Confirmed Calendar Bookings */}
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <CalendarIcon className="h-4.5 w-4.5 text-red-650 animate-pulse" /> Confirmed Shoot Dates
              </h3>
              
              {bookings.map(bk => (
                <div key={bk.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                      <Film className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{bk.project}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Role: {bk.role} | Shoot Dates: {bk.shootDates}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold rounded-full px-2.5 py-0.5">{bk.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

        </section>

      </main>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white text-[#1d1d1f] border-slate-200 rounded-[32px] p-6 max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-650 animate-pulse shrink-0" /> Edit Talent Profile Details
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-bold leading-normal">
              Manage your day rates, availability status, casting requirements, measurements, and showreels.
            </DialogDescription>
          </DialogHeader>

          {/* Top Sleek Clickable Stepper Progress Menu */}
          <div className="mt-4 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-100 flex items-center justify-between gap-1 shadow-inner">
            {[
              { id: 1, label: "Identity", desc: "Basic Bio" },
              { id: 2, label: "Rates", desc: "Day Rate" },
              { id: 3, label: "Measurements", desc: "Physicals" },
              { id: 4, label: "Preferences", desc: "Campaigns" },
              { id: 5, label: "Media Links", desc: "Socials" }
            ].map((step) => {
              const isCurrent = wizardStep === step.id;
              const isPassed = wizardStep > step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setWizardStep(step.id)}
                  className={`flex flex-col items-center flex-1 py-2 rounded-xl transition-all duration-300 outline-none ${
                    isCurrent 
                      ? 'bg-white shadow-sm border border-slate-200' 
                      : 'border border-transparent hover:bg-slate-150/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-red-650 text-white shadow-md shadow-red-500/20' 
                        : isPassed 
                          ? 'bg-emerald-500 text-white font-bold' 
                          : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPassed ? "✓" : step.id}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest mt-1 hidden md:inline transition-colors duration-200 ${
                      isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-5 pt-1">
            
            {/* Step 1: Basic Profile */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <Edit3 className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Step 1: Stage Identity & Location</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Stage Name</label>
                    <Input 
                      type="text" 
                      value={tempData.stageName}
                      onChange={(e) => setTempData({ ...tempData, stageName: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Full Name</label>
                    <Input 
                      type="text" 
                      value={tempData.fullName}
                      onChange={(e) => setTempData({ ...tempData, fullName: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Category</label>
                    <Input 
                      type="text" 
                      value={tempData.category}
                      onChange={(e) => setTempData({ ...tempData, category: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Location</label>
                    <Input 
                      type="text" 
                      value={tempData.location}
                      onChange={(e) => setTempData({ ...tempData, location: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Bio Description</label>
                  <textarea 
                    value={tempData.bio}
                    onChange={(e) => setTempData({ ...tempData, bio: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-20 w-full p-3 outline-none font-bold focus:bg-white transition-all duration-200 shadow-inner"
                    placeholder="Describe your artistic persona and background..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Languages Spoken (comma-separated)</label>
                  <Input 
                    type="text" 
                    value={tempData.languages}
                    onChange={(e) => setTempData({ ...tempData, languages: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold focus:bg-white transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Casting & Rates */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Step 2: Casting Day Rate & Reach</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Casting Day Rate</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-extrabold text-xs">₹</span>
                      <Input 
                        type="number" 
                        value={tempData.dayRate}
                        onChange={(e) => setTempData({ ...tempData, dayRate: e.target.value })}
                        className="bg-slate-50 border border-slate-200 text-slate-855 rounded-xl text-xs h-10 pl-7 font-black tracking-tight focus:bg-white transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Calendar Availability</label>
                    <select 
                      value={tempData.availability}
                      onChange={(e) => setTempData({ ...tempData, availability: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs h-10 px-3 w-full outline-none font-black tracking-wide focus:bg-white transition-all duration-200"
                    >
                      <option value="Available">🟢 Available (Accepting Proposals)</option>
                      <option value="Busy">🟡 Busy (Next 14 Days Booked)</option>
                      <option value="On Shoot">🔴 On Shoot (Unavailable)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reach / Followers</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-extrabold text-[10px]">✨</span>
                      <Input 
                        type="number" 
                        value={tempData.reach}
                        onChange={(e) => setTempData({ ...tempData, reach: e.target.value })}
                        className="bg-slate-50 border border-slate-200 text-slate-855 rounded-xl text-xs h-10 pl-7 font-black tracking-tight focus:bg-white transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Engagement Rate</label>
                    <Input 
                      type="text" 
                      value={tempData.engagementRate}
                      onChange={(e) => setTempData({ ...tempData, engagementRate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-855 rounded-xl text-xs h-10 font-black tracking-tight focus:bg-white transition-all duration-200"
                      placeholder="e.g. 8.2%"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Measurements */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Step 3: Physical Measurements</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Height</label>
                    <Input 
                      type="text" 
                      value={tempData.height || ""}
                      onChange={(e) => setTempData({ ...tempData, height: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 185 cm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Weight</label>
                    <Input 
                      type="text" 
                      value={tempData.weight || ""}
                      onChange={(e) => setTempData({ ...tempData, weight: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 78 kg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Chest Size</label>
                    <Input 
                      type="text" 
                      value={tempData.chest || ""}
                      onChange={(e) => setTempData({ ...tempData, chest: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 40 in"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Waist Size</label>
                    <Input 
                      type="text" 
                      value={tempData.waist || ""}
                      onChange={(e) => setTempData({ ...tempData, waist: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 32 in"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Hip Size</label>
                    <Input 
                      type="text" 
                      value={tempData.hip || ""}
                      onChange={(e) => setTempData({ ...tempData, hip: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 38 in"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Shoe Size</label>
                    <Input 
                      type="text" 
                      value={tempData.shoeSize || ""}
                      onChange={(e) => setTempData({ ...tempData, shoeSize: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. 10 US"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Hair Color</label>
                    <Input 
                      type="text" 
                      value={tempData.hairColor || ""}
                      onChange={(e) => setTempData({ ...tempData, hairColor: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. Black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Skin Tone</label>
                    <Input 
                      type="text" 
                      value={tempData.skinTone || ""}
                      onChange={(e) => setTempData({ ...tempData, skinTone: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. Wheatish"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Tattoos</label>
                    <Input 
                      type="text" 
                      value={tempData.tattoos || ""}
                      onChange={(e) => setTempData({ ...tempData, tattoos: e.target.value })}
                      className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold focus:bg-white transition-all duration-200 text-center"
                      placeholder="e.g. None"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Step 4: Campaign Preferences */}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Step 4: Casting Brand Preferences</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Comfortable Campaigns Card */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-emerald-600">👍</span>
                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Comfortable Campaigns</label>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Click suggestions to add</span>
                    </div>
                    <textarea 
                      value={tempData.comfortable ? (Array.isArray(tempData.comfortable) ? tempData.comfortable.join(", ") : tempData.comfortable) : ""}
                      onChange={(e) => setTempData({ ...tempData, comfortable: e.target.value.split(",").map(s => s.trim()) })}
                      className="bg-white border border-emerald-100 text-slate-850 rounded-xl text-xs h-16 w-full p-2.5 outline-none font-bold focus:border-emerald-300 transition-all shadow-sm"
                      placeholder="TV Commercials, Brand Collaborations, Action Shoots..."
                    />
                    
                    {/* Clickable Suggestions Grid for Comfortable Campaigns */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "TV Commercials", "Brand Collaborations", "Action Shoots", "Automotive Ads", 
                        "Fashion & Lifestyle", "Stunt Work", "Fitness Campaigns", "High-Action Leads", 
                        "Product Shoots", "Digital Campaigns"
                      ].map((sugg) => {
                        const items = tempData.comfortable 
                          ? (Array.isArray(tempData.comfortable) ? tempData.comfortable : tempData.comfortable.split(",").map((s) => s.trim()))
                          : [];
                        const isSelected = items.some((item) => item.toLowerCase() === sugg.toLowerCase());
                        
                        const handleToggle = () => {
                          let updated;
                          if (isSelected) {
                            updated = items.filter((item) => item.toLowerCase() !== sugg.toLowerCase());
                          } else {
                            // Filter out empty items
                            const cleanItems = items.filter(Boolean);
                            updated = [...cleanItems, sugg];
                          }
                          setTempData({ ...tempData, comfortable: updated });
                        };

                        return (
                          <button
                            key={sugg}
                            type="button"
                            onClick={handleToggle}
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border transition-all duration-200 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/10'
                                : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-600 hover:bg-emerald-50/50'
                            }`}
                          >
                            {isSelected ? `✓ ${sugg}` : `+ ${sugg}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Uncomfortable Campaigns Card */}
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600">⚠️</span>
                        <label className="text-[10px] font-black text-red-700 uppercase tracking-wider">Uncomfortable Campaigns</label>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Click suggestions to add</span>
                    </div>
                    <textarea 
                      value={tempData.uncomfortable ? (Array.isArray(tempData.uncomfortable) ? tempData.uncomfortable.join(", ") : tempData.uncomfortable) : ""}
                      onChange={(e) => setTempData({ ...tempData, uncomfortable: e.target.value.split(",").map(s => s.trim()) })}
                      className="bg-white border border-red-100 text-slate-855 rounded-xl text-xs h-16 w-full p-2.5 outline-none font-bold focus:border-red-300 transition-all shadow-sm"
                      placeholder="Smoking Scenes, Political Campaigns..."
                    />

                    {/* Clickable Suggestions Grid for Uncomfortable Campaigns */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "Smoking Scenes", "Alcohol Ads", "Political Ads", "Religious Content", 
                        "Extreme Heights", "Deep Water Stunts", "Nudity & Adult", "Tobacco Campaigns"
                      ].map((sugg) => {
                        const items = tempData.uncomfortable 
                          ? (Array.isArray(tempData.uncomfortable) ? tempData.uncomfortable : tempData.uncomfortable.split(",").map((s) => s.trim()))
                          : [];
                        const isSelected = items.some((item) => item.toLowerCase() === sugg.toLowerCase());
                        
                        const handleToggle = () => {
                          let updated;
                          if (isSelected) {
                            updated = items.filter((item) => item.toLowerCase() !== sugg.toLowerCase());
                          } else {
                            // Filter out empty items
                            const cleanItems = items.filter(Boolean);
                            updated = [...cleanItems, sugg];
                          }
                          setTempData({ ...tempData, uncomfortable: updated });
                        };

                        return (
                          <button
                            key={sugg}
                            type="button"
                            onClick={handleToggle}
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border transition-all duration-200 ${
                              isSelected
                                ? 'bg-red-650 border-red-650 text-white shadow-sm shadow-red-500/10'
                                : 'bg-white border-slate-200 hover:border-red-300 text-slate-650 hover:bg-red-50/50'
                            }`}
                          >
                            {isSelected ? `✓ ${sugg}` : `+ ${sugg}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Media & Social Links */}
            {wizardStep === 5 && (
              <div className="space-y-4 animate-fade-in max-h-[50vh] overflow-y-auto pr-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <Film className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Step 5: Media & Connected Channels</h4>
                </div>
                
                {/* Social media links editing */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Connected Social Channels</span>
                  
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Instagram Profile Link</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                          <Instagram className="h-3.5 w-3.5 text-pink-600" />
                        </div>
                        <Input 
                          type="text" 
                          value={tempData.instagram || ""}
                          onChange={(e) => setTempData({ ...tempData, instagram: e.target.value })}
                          className="bg-white border-slate-200 text-slate-850 text-xs h-9 pl-9 rounded-xl font-bold focus:bg-white transition-all"
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">YouTube Channel Link</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                          <Youtube className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <Input 
                          type="text" 
                          value={tempData.youtube || ""}
                          onChange={(e) => setTempData({ ...tempData, youtube: e.target.value })}
                          className="bg-white border-slate-200 text-slate-850 text-xs h-9 pl-9 rounded-xl font-bold focus:bg-white transition-all"
                          placeholder="https://youtube.com/channel"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">LinkedIn Profile Link</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                          <Sparkle className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <Input 
                          type="text" 
                          value={tempData.linkedin || ""}
                          onChange={(e) => setTempData({ ...tempData, linkedin: e.target.value })}
                          className="bg-white border-slate-200 text-slate-855 text-xs h-9 pl-9 rounded-xl font-bold focus:bg-white transition-all"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Facebook Profile Link</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                          <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                        </div>
                        <Input 
                          type="text" 
                          value={tempData.facebook || ""}
                          onChange={(e) => setTempData({ ...tempData, facebook: e.target.value })}
                          className="bg-white border-slate-200 text-slate-855 text-xs h-9 pl-9 rounded-xl font-bold focus:bg-white transition-all"
                          placeholder="https://facebook.com/username"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Showreels */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Showreel Video 1</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-bold block">Title</label>
                      <Input 
                        type="text" 
                        value={tempData.reel1Title || ""}
                        onChange={(e) => setTempData({ ...tempData, reel1Title: e.target.value })}
                        className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-bold block">Duration</label>
                      <Input 
                        type="text" 
                        value={tempData.reel1Duration || ""}
                        onChange={(e) => setTempData({ ...tempData, reel1Duration: e.target.value })}
                        className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 uppercase font-bold block">Video MP4 URL</label>
                    <Input 
                      type="text" 
                      value={tempData.reel1Url || ""}
                      onChange={(e) => setTempData({ ...tempData, reel1Url: e.target.value })}
                      className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Showreel Video 2</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-bold block">Title</label>
                      <Input 
                        type="text" 
                        value={tempData.reel2Title || ""}
                        onChange={(e) => setTempData({ ...tempData, reel2Title: e.target.value })}
                        className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-bold block">Duration</label>
                      <Input 
                        type="text" 
                        value={tempData.reel2Duration || ""}
                        onChange={(e) => setTempData({ ...tempData, reel2Duration: e.target.value })}
                        className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 uppercase font-bold block">Video MP4 URL</label>
                    <Input 
                      type="text" 
                      value={tempData.reel2Url || ""}
                      onChange={(e) => setTempData({ ...tempData, reel2Url: e.target.value })}
                      className="bg-white border-slate-200 text-slate-850 text-xs h-9 rounded-lg font-bold"
                    />
                  </div>
                </div>

                {/* Lookbook photo urls */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Lookbook Photo URLs (comma separated)</label>
                  <textarea 
                    value={tempData.galleryUrls || ""}
                    onChange={(e) => setTempData({ ...tempData, galleryUrls: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-20 w-full p-2.5 outline-none font-bold"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {wizardStep > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setWizardStep(prev => prev - 1)} 
                    className="rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black bg-white text-slate-700 h-10 px-4 transition shrink-0"
                  >
                    Back
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditOpen(false)} 
                  className="rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black bg-white text-slate-700 h-10 px-4 transition shrink-0"
                >
                  Cancel
                </Button>
              </div>

              {wizardStep < 5 ? (
                <Button 
                  type="button" 
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="bg-red-650 hover:bg-red-700 text-white rounded-full text-xs font-black h-10 px-5 shadow shadow-red-500/20 transition-all duration-300"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-black h-10 px-5 shadow shadow-red-500/20 transition-all duration-300"
                >
                  Save Profile Changes
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
