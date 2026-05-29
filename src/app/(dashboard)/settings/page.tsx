
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Lock, 
  Puzzle, 
  LogOut,
  Loader2,
  LayoutGrid,
  Film,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Search,
  PieChart,
  Building2,
  Globe,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Camera,
  AlertCircle,
  Wallet,
  Palette,
  Check,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const THEME_PRESETS = [
  { name: "DP Premium Red", primary: "#D32F2F", accent: "#B71C1C" },
  { name: "Slate Glass", primary: "#0F172A", accent: "#334155" },
];

const DEFAULT_THEME = {
  primary: "#D32F2F",
  accent: "#B71C1C"
};

function AccountCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useSupabase();
  const { profile: tenantProfile, settings, company, companyId, isLoading: isTenantLoading } = useTenant();
  
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop State
  const [cropData, setCropData] = useState({
    imageSrc: '',
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null as any,
    isOpen: false,
    originalFile: null as File | null
  });

  // Profile State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: ""
  });

  // Company State
  const [companyData, setCompanyData] = useState({
    name: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    cin: "",
    gstin: "",
    address: "",
    bank_name: "",
    account_no: "",
    ifsc: "",
    branch: "",
    pan: ""
  });

  // Theme State
  const [themeColors, setThemeColors] = useState({
    primary: "#1e3a8a",
    accent: "#ff4b82",
    darkMode: false
  });

  useEffect(() => {
    if (tenantProfile) {
      setProfileData({
        name: tenantProfile.fullName || tenantProfile.full_name || "",
        email: tenantProfile.email || "",
        bio: tenantProfile.bio || "",
        avatar: tenantProfile.avatar || ""
      });
    }
    if (company) {
      setCompanyData({
        name: company.name || "",
        website: company.website || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
        cin: company.cin || "",
        gstin: company.gstin || "",
        address: company.address || "",
        bank_name: company.bank_details?.bank_name || "",
        account_no: company.bank_details?.account_no || "",
        ifsc: company.bank_details?.ifsc || "",
        branch: company.bank_details?.branch || "",
        pan: company.bank_details?.pan || ""
      });
    }
    if (tenantProfile?.theme_preference) {
      setThemeColors({
        primary: (tenantProfile.theme_preference as any).primary || "#1e3a8a",
        accent: (tenantProfile.theme_preference as any).accent || "#ff4b82",
        darkMode: (tenantProfile.theme_preference as any).darkMode || false
      });
    } else if (settings?.theme) {
      setThemeColors({
        primary: (settings.theme as any).primary || "#1e3a8a",
        accent: (settings.theme as any).accent || "#ff4b82",
        darkMode: (settings.theme as any).darkMode || false
      });
    }
  }, [tenantProfile, company, settings]);

  useEffect(() => {
    // Instant Live Preview
    const root = document.documentElement;
    if (themeColors.primary) {
      const hsl = hexToHsl(themeColors.primary);
      if (hsl) root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
    if (themeColors.accent) {
      const hsl = hexToHsl(themeColors.accent);
      if (hsl) root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
    if (themeColors.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeColors]);

  const modulesList = [
    { id: "dashboard", name: "Dashboard", desc: "Workspace overview and task summary", icon: LayoutGrid, isCore: true },
    { id: "projects", name: "Project Management", desc: "Production workflows, budgets, and schedules", icon: Film, isCore: true },
    { id: "talents", name: "Talent Network", desc: "Global actor and influencer booking database", icon: Users },
    { id: "crm", name: "Sales CRM", desc: "Client relationship and pipeline tracking", icon: Briefcase },
    { id: "proposals", name: "Proposal Wizard", desc: "AI-assisted production proposal generation", icon: FileText },
    { id: "invoices", name: "Invoice and Quote", desc: "Automated billing and quotation system", icon: Receipt },
    { id: "accounts", name: "Accounts", desc: "Manage bank accounts and company liquidity", icon: Wallet },
    { id: "research", name: "Market Intelligence", icon: Search },
    { id: "reports", name: "Analytics", desc: "Revenue trends and performance reports", icon: PieChart },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  const handleSaveProfile = async () => {
    if (!tenantProfile?.id) return;
    const { error } = await supabase.from('User').update({
      fullName: profileData.name,
      avatar: profileData.avatar,
      // bio: profileData.bio, // TODO: Add 'bio' column to Supabase User table
    }).eq('id', tenantProfile.id);

    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } else {
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
    }
  };

  const handleSaveCompany = async () => {
    if (!companyId) return;
    const { error } = await supabase.from('Company').update({
      name: companyData.name,
      website: companyData.website,
      contact_email: companyData.contact_email,
      contact_phone: companyData.contact_phone,
      cin: companyData.cin,
      gstin: companyData.gstin,
      address: companyData.address,
      bank_details: {
        bank_name: companyData.bank_name,
        account_no: companyData.account_no,
        ifsc: companyData.ifsc,
        branch: companyData.branch,
        pan: companyData.pan
      },
    }).eq('id', companyId);

    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } else {
      toast({ title: "Company Profile Saved", description: "Workspace details updated successfully." });
    }
  };

  const handleSaveTheme = async () => {
    if (!tenantProfile?.id) return;
    const { error } = await supabase.from('User').update({
      theme_preference: {
        primary: themeColors.primary,
        accent: themeColors.accent,
        darkMode: themeColors.darkMode,
      }
    }).eq('id', tenantProfile.id);

    if (error) {
      toast({ variant: "destructive", title: "Theme Save Failed", description: error.message });
    } else {
      toast({ title: "Branding Updated", description: "Your personal theme preferences have been saved." });
    }
  };

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    if (!companyId) return;
    const currentModules = settings?.modules_enabled || ['dashboard', 'projects'];
    let updatedModules;
    if (enabled) {
      updatedModules = Array.from(new Set([...currentModules, moduleId]));
    } else {
      updatedModules = currentModules.filter((id: string) => id !== moduleId);
    }
    
    const { error } = await supabase.from('CompanySettings').upsert({
      id: settings?.id || crypto.randomUUID(),
      company_id: companyId,
      modules_enabled: updatedModules,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

    if (error) {
      toast({ variant: "destructive", title: "Toggle Failed", description: error.message });
    } else {
      toast({ title: enabled ? "Module Enabled" : "Module Disabled" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image file." });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropData(prev => ({
        ...prev,
        imageSrc: reader.result?.toString() || '',
        isOpen: true,
        originalFile: file
      }));
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCropData(prev => ({ ...prev, croppedAreaPixels }));
  };

  const processAndUploadCroppedImage = async () => {
    const { imageSrc, croppedAreaPixels, originalFile } = cropData;
    const uid = user?.id;
    if (!imageSrc || !croppedAreaPixels || !originalFile || !uid) return;

    setCropData(prev => ({ ...prev, isOpen: false }));
    setIsUploading(true);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) throw new Error("Could not crop image");

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      
      const finalFile = await imageCompression(croppedImage, options);

      const fileExt = finalFile.name.split('.').pop() || 'jpg';
      const fileName = `${uid}-${Math.random()}.${fileExt}`;
      const filePath = `${uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, finalFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setProfileData(prev => ({ ...prev, avatar: publicUrl }));
      
      await supabase.from('User').update({
        avatar: publicUrl,
      }).eq('id', uid);

      toast({ title: "Profile Image Updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsUploading(false);
      setCropData({ imageSrc: '', crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null, isOpen: false, originalFile: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Account Center</h1>
          <p className="text-muted-foreground">Manage your personal presence and workspace configuration.</p>
        </div>
        <Button variant="ghost" className="rounded-xl px-6 text-accent hover:bg-accent/10" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white/5 dark:bg-slate-900/50 dark:bg-slate-900/50 border p-1 h-auto flex-wrap gap-1 rounded-[10px]">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="theme" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette className="h-4 w-4" /> Theme
          </TabsTrigger>
          {tenantProfile?.role_id !== 'EMPLOYEE' && (
            <>
              <TabsTrigger value="company" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Building2 className="h-4 w-4" /> Company
              </TabsTrigger>
              <TabsTrigger value="modules" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Puzzle className="h-4 w-4" /> Modules
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Lock className="h-4 w-4" /> Security
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-none shadow-soft rounded-[10px] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Avatar className={cn(
                    "h-24 w-24 ring-4 ring-white dark:ring-slate-900 shadow-xl transition-all",
                    isUploading && "opacity-50"
                  )}>
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-2xl font-bold bg-white dark:bg-slate-900 text-foreground">
                      {profileData.name.substring(0,2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity",
                    isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{profileData.name || "User"}</CardTitle>
                  <CardDescription className="uppercase text-[10px] font-bold tracking-widest mt-1">
                    {tenantProfile?.role_id?.toUpperCase() || 'MEMBER'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture URL (Optional)</Label>
                  <Input 
                    value={profileData.avatar} 
                    onChange={(e) => setProfileData({...profileData, avatar: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Bio</Label>
                  <Input 
                    value={profileData.bio} 
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="rounded-xl px-8 font-bold">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THEME TAB */}
        <TabsContent value="theme" className="space-y-6 animate-in fade-in duration-500">
          <Card className="border-none shadow-soft rounded-[10px] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-foreground shadow-sm">
                  <Palette className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Workspace Branding</CardTitle>
                  <CardDescription>Personalize the visual identity of your production OS.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Presets */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Branding Presets</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setThemeColors({ primary: preset.primary, accent: preset.accent })}
                      className={cn(
                        "p-4 rounded-[10px] border-2 transition-all text-left flex flex-col gap-3 group relative",
                        themeColors.primary === preset.primary && themeColors.accent === preset.accent
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-border bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className="flex gap-1.5">
                        <div className="h-6 w-6 rounded-full shadow-inner" style={{ backgroundColor: preset.primary }} />
                        <div className="h-6 w-6 rounded-full shadow-inner" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="text-[10px] font-bold truncate">{preset.name}</span>
                      {themeColors.primary === preset.primary && themeColors.accent === preset.accent && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-3 w-3 text-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Custom Palette
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label>Primary Color</Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Headers & Navigation</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl shadow-sm border border-border" style={{ backgroundColor: themeColors.primary }} />
                        <Input 
                          type="color" 
                          value={themeColors.primary}
                          onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                          className="w-12 h-10 p-1 rounded-lg border-none bg-transparent cursor-pointer"
                        />
                        <Input 
                          value={themeColors.primary}
                          onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                          className="w-24 font-mono text-xs h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label>Accent Color</Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Buttons & Highlighting</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl shadow-sm border border-border" style={{ backgroundColor: themeColors.accent }} />
                        <Input 
                          type="color" 
                          value={themeColors.accent}
                          onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                          className="w-12 h-10 p-1 rounded-lg border-none bg-transparent cursor-pointer"
                        />
                        <Input 
                          value={themeColors.accent}
                          onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                          className="w-24 font-mono text-xs h-10 rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label>Dark Mode</Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Toggle dark interface</p>
                      </div>
                      <Switch 
                        checked={themeColors.darkMode}
                        onCheckedChange={(checked) => setThemeColors({ ...themeColors, darkMode: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-[10px] p-8 border border-border flex flex-col justify-center">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6">Live Theme Preview</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: themeColors.primary }}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: themeColors.primary }}>Workspace Sidebar</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Navigation State</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                    </div>
                    <Button 
                      className="w-full rounded-xl h-11 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl" 
                      style={{ backgroundColor: themeColors.accent, color: 'white' }}
                    >
                      Sample Action Button
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button onClick={handleSaveTheme} className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-primary/20">
                  Apply Theme Changes
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setThemeColors({ primary: "#1e3a8a", accent: "#ff4b82" })}
                  className="rounded-xl font-bold text-muted-foreground gap-2"
                >
                  <RefreshCcw className="h-4 w-4" /> Reset Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPANY TAB */}
        <TabsContent value="company" className="space-y-6">
          <Card className="border-none shadow-soft rounded-[10px] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-foreground shadow-sm">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Company Workspace</CardTitle>
                  <CardDescription>Legal and operational details for your media production entity.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Core Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Registered Name</Label>
                    <Input 
                      value={companyData.name} 
                      onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Official Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.website} 
                        onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                        className="pl-9 rounded-xl"
                        placeholder="www.yourcompany.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.contact_email} 
                        onChange={(e) => setCompanyData({...companyData, contact_email: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.contact_phone} 
                        onChange={(e) => setCompanyData({...companyData, contact_phone: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal & Tax */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Legal & Tax Identifiers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>CIN (Corporate Identification Number)</Label>
                    <Input 
                      value={companyData.cin} 
                      onChange={(e) => setCompanyData({...companyData, cin: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input 
                      value={companyData.gstin} 
                      onChange={(e) => setCompanyData({...companyData, gstin: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Official Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.address} 
                        onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Bank Registry (For Invoices)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input 
                      value={companyData.bank_name} 
                      onChange={(e) => setCompanyData({...companyData, bank_name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input 
                      value={companyData.account_no} 
                      onChange={(e) => setCompanyData({...companyData, account_no: e.target.value})}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input 
                      value={companyData.ifsc} 
                      onChange={(e) => setCompanyData({...companyData, ifsc: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input 
                      value={companyData.branch} 
                      onChange={(e) => setCompanyData({...companyData, branch: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN (Company)</Label>
                    <Input 
                      value={companyData.pan} 
                      onChange={(e) => setCompanyData({...companyData, pan: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveCompany} className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-primary/20">
                  Save Workspace Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODULES TAB */}
        <TabsContent value="modules">
          <Card className="border-none shadow-soft rounded-[10px] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Module Customization</CardTitle>
              <CardDescription>Enable features for your production workspace.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {modulesList.map(mod => {
                const isEnabled = settings?.modules_enabled?.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-[10px]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg"><mod.icon className="h-5 w-5 text-foreground" /></div>
                      <div>
                        <h4 className="font-bold text-sm">{mod.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{mod.desc || 'Modular media utility'}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={isEnabled || mod.isCore} 
                      disabled={mod.isCore}
                      onCheckedChange={(checked) => handleToggleModule(mod.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={cropData.isOpen} onOpenChange={(open) => setCropData(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] w-full bg-slate-900 rounded-xl overflow-hidden mt-4">
            <Cropper
              image={cropData.imageSrc}
              crop={cropData.crop}
              zoom={cropData.zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={(crop) => setCropData(prev => ({ ...prev, crop }))}
              onZoomChange={(zoom) => setCropData(prev => ({ ...prev, zoom }))}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="pt-4">
            <Label className="text-xs mb-2 block">Zoom</Label>
            <input
              type="range"
              value={cropData.zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setCropData(prev => ({ ...prev, zoom: Number(e.target.value) }))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setCropData(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button onClick={processAndUploadCroppedImage} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Crop & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountCenterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountCenterContent />
    </Suspense>
  );
}

/**
 * Utility to convert a Hex color string to an HSL object.
 * Returns null if the hex input is invalid.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (typeof hex !== 'string') return null;
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
