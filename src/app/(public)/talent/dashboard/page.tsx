"use client";

import React, { useState } from "react";
import { 
  Sparkles, Calendar as CalendarIcon, MessageCircle, DollarSign, MapPin, Instagram, 
  Youtube, Plus, Trash2, ArrowRight, ShieldCheck, CheckCircle2, Lock, 
  Eye, Edit3, Image as ImageIcon, Send, Film, Clock, LogOut, Award,
  CheckCircle, ShieldAlert, BarChart3, TrendingUp, Sparkle, Shield, AlertCircle, FileText
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
    availability: "Available"
  });

  // Creator Privacy Settings (Phase 5)
  const [privacySetting, setPrivacySetting] = useState("Show WhatsApp After Approval");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempData, setTempData] = useState({ ...profileData });

  // Sandbox Inquiries (Phase 2)
  const [inquiries, setInquiries] = useState([
    { id: "inq_1", client: "Pulse Beverages Ltd", project: "Pulse Energy Summer TVC", days: 3, budget: "₹10,50,000", date: "2026-06-12", status: "Review", time: "2 hours ago" },
    { id: "inq_2", client: "Federal Bank Kochi", project: "Regional Festival Film", days: 1, budget: "₹3,50,000", date: "2026-06-28", status: "Approved", time: "Yesterday" }
  ]);

  // Secure Chat Sessions (Phase 4, 7)
  const [selectedChatId, setSelectedChatId] = useState<string>("inq_2");
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({
    "inq_1": [
      { id: 1, sender: "client", text: "Hi Tovino! Proposing a lead role for our summer energy commercial. Let us know if the day rate fits.", time: "10:30 AM" }
    ],
    "inq_2": [
      { id: 1, sender: "client", text: "Hello! Nimisha's scheduling matches perfectly. We can proceed with contract signing.", time: "Yesterday" },
      { id: 2, sender: "manager", text: "Approved by manager. Chat unlocked for shoot setup.", time: "Yesterday" }
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

  const handlePrivacyChange = (setting: string) => {
    setPrivacySetting(setting);
    toast({
      title: "Privacy Rule Updated",
      description: `Secure settings changed to: "${setting}".`
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
                      type="radio" 
                      name="privacyRule"
                      checked={privacySetting === setting}
                      onChange={() => handlePrivacyChange(setting)}
                      className="text-red-650 focus:ring-red-500 h-4 w-4"
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

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white text-[#1d1d1f] border-slate-200 rounded-3xl p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 leading-tight">Edit Creator Details</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-bold leading-normal">Update your casting day rates and calendar availability.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileSave} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Stage Name</label>
              <Input 
                type="text" 
                value={tempData.stageName}
                onChange={(e) => setTempData({ ...tempData, stageName: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Casting Day Rate (₹)</label>
              <Input 
                type="number" 
                value={tempData.dayRate}
                onChange={(e) => setTempData({ ...tempData, dayRate: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Availability</label>
              <select 
                value={tempData.availability}
                onChange={(e) => setTempData({ ...tempData, availability: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs h-10 px-2 w-full outline-none font-bold"
              >
                <option value="Available" className="bg-white text-slate-800 font-bold">Available</option>
                <option value="Busy" className="bg-white text-slate-800 font-bold">Busy</option>
                <option value="On Shoot" className="bg-white text-slate-800 font-bold">On Shoot</option>
              </select>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-bold bg-white text-slate-700 h-10 shadow-sm transition">
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold h-10 px-5 shadow shadow-red-500/10 transition">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
