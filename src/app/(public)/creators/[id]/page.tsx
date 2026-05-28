"use client";

import React, { useState, use, useEffect } from "react";
import { 
  ArrowLeft, Star, MapPin, Instagram, Youtube, Linkedin, Globe, 
  Video, Calendar, AlertCircle, ArrowRight, ShieldCheck, Mail, 
  Phone, UserCheck, MessageCircle, PlayCircle, Plus, Send, Zap, Award,
  CheckCircle2, Share2, Heart, ShieldAlert, Check, CalendarDays, Bookmark,
  FileDown, QrCode, Facebook, CheckSquare, X, Info, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Expanded mock data with physical details, preferences, and digital metrics (Phase 1, 2, 3, 4)
const PUBLIC_TALENTS_DB: Record<string, any> = {
  "public_t1": {
    id: "public_t1",
    fullName: "Tovino Thomas",
    stageName: "Tovino",
    category: "Actor",
    skills: ["Method Acting", "Stunts", "Cinematic Action", "Dialect Mastery"],
    location: "Kochi, Kerala",
    dayRate: 350000,
    followers: 7800000,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500",
    bannerUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=1200&h=400",
    verifiedLevel: "Premium",
    languages: ["Malayalam", "English", "Tamil"],
    rating: 4.9,
    availability: "Available",
    bio: "Tovino Thomas is a highly acclaimed actor and producer known for his versatility, intense screen presence, and box-office blockbuster success in regional Indian cinema.",
    reels: [
      { id: "r1", title: "Cinematic Showreel 2026", duration: "2:45", url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e330120d9e5e783ae91620d436e&profile_id=139&oauth2_token_id=57447761" },
      { id: "r2", title: "Action Compilation Reel", duration: "1:30", url: "https://player.vimeo.com/external/435674703.sd.mp4?s=7f3747ebc7cc93322f79fb5814523a9d20c3a502&profile_id=139&oauth2_token_id=57447761" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=800"
    ],
    experience: "12+ Years in Professional Film & Commercial Advertising campaigns.",
    instagram: "@tovinothomas",
    youtube: "Tovino Thomas Official",
    linkedin: "tovino-thomas",
    engagementRate: "8.2%",
    
    // Measurements (Phase 2)
    measurements: {
      height: "185 cm",
      weight: "78 kg",
      chest: "40 inches",
      waist: "32 inches",
      hip: "38 inches",
      shoeSize: "10 UK",
      hairColor: "Black",
      eyeColor: "Dark Brown",
      skinTone: "Wheatish",
      beardStyle: "Short Boxed Beard",
      tattoos: "Left forearm sleeve (geometric)"
    },

    // Preferences & Comfort Tiers (Phase 3)
    preferences: {
      comfortable: [
        "Western Wear",
        "Traditional Wear",
        "Corporate Ads",
        "Action Sequences",
        "Night Shoots",
        "Live Hosting",
        "Brand Collaborations",
        "Travel Videos"
      ],
      uncomfortable: [
        "Smoking Scenes",
        "Alcohol Promotions",
        "Political Campaigns",
        "Religious Campaigns",
        "Horror Content"
      ],
      willingToTravel: "100% (National & International)",
      nightShoots: "Comfortable",
      danceComfort: "Intermediate"
    }
  },
  "public_t2": {
    id: "public_t2",
    fullName: "Nimisha Sajayan",
    stageName: "Nimisha",
    category: "Actor",
    skills: ["Emotional Realism", "Improvisation", "Dubbing", "Theatrical Arts"],
    location: "Kochi, Kerala",
    dayRate: 150000,
    followers: 1800000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200&h=400",
    verifiedLevel: "Verified",
    languages: ["Malayalam", "English", "Tamil"],
    rating: 4.8,
    availability: "Available",
    bio: "Nimisha Sajayan is a critically recognized, national award-winning artist celebrated for her highly realistic portrayals and intense dramatic work.",
    reels: [
      { id: "r1", title: "Drama Monologue Compilation", duration: "3:10", url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e330120d9e5e783ae91620d436e&profile_id=139&oauth2_token_id=57447761" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=800",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800"
    ],
    experience: "7+ Years in Leading Roles & Feature Drama Cinema.",
    instagram: "@nimisha_sajayan",
    youtube: "Nimisha Sajayan Channel",
    linkedin: "nimisha-sajayan",
    engagementRate: "6.9%",
    
    // Measurements (Phase 2)
    measurements: {
      height: "167 cm",
      weight: "58 kg",
      chest: "34 inches",
      waist: "28 inches",
      hip: "36 inches",
      shoeSize: "6 UK",
      hairColor: "Dark Brown",
      eyeColor: "Black",
      skinTone: "Fair",
      beardStyle: "Not Applicable",
      tattoos: "None"
    },

    // Preferences & Comfort Tiers (Phase 3)
    preferences: {
      comfortable: [
        "Traditional Wear",
        "Corporate Ads",
        "Comedy Content",
        "Travel Videos",
        "Couple Shoots",
        "Brand Collaborations"
      ],
      uncomfortable: [
        "Smoking Scenes",
        "Alcohol Promotions",
        "Political Campaigns",
        "Intimate Scenes",
        "Late Night Shoots"
      ],
      willingToTravel: "Highly Willing",
      nightShoots: "Restricted",
      danceComfort: "Expert"
    }
  }
};

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function PublicCreatorPortfolioPage({ params }: PageProps) {
  const { toast } = useToast();
  
  // Resolve params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  
  const initialCreator = PUBLIC_TALENTS_DB[id] || PUBLIC_TALENTS_DB["public_t1"];
  const [currentCreator, setCurrentCreator] = useState(initialCreator);
  const creator = currentCreator;

  // Form & Interaction states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = id === "public_t1" || !PUBLIC_TALENTS_DB[id] ? "talent_profile_public_t1" : `talent_profile_${id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const mapped = {
            ...initialCreator,
            fullName: parsed.fullName || initialCreator.fullName,
            stageName: parsed.stageName || initialCreator.stageName,
            category: parsed.category || initialCreator.category,
            location: parsed.location || initialCreator.location,
            dayRate: Number(parsed.dayRate) || initialCreator.dayRate,
            followers: Number(parsed.reach) || initialCreator.followers,
            languages: typeof parsed.languages === "string" ? parsed.languages.split(",").map((s: string) => s.trim()) : parsed.languages || initialCreator.languages,
            availability: parsed.availability || initialCreator.availability,
            bio: parsed.bio || initialCreator.bio,
            instagram: parsed.instagram || initialCreator.instagram,
            youtube: parsed.youtube || initialCreator.youtube,
            linkedin: parsed.linkedin || initialCreator.linkedin,
            facebook: parsed.facebook || initialCreator.facebook,
            engagementRate: parsed.engagementRate || initialCreator.engagementRate,
            measurements: {
              ...initialCreator.measurements,
              height: parsed.height || initialCreator.measurements.height,
              weight: parsed.weight || initialCreator.measurements.weight,
              chest: parsed.chest || initialCreator.measurements.chest,
              waist: parsed.waist || initialCreator.measurements.waist,
              hip: parsed.hip || initialCreator.measurements.hip,
              shoeSize: parsed.shoeSize || initialCreator.measurements.shoeSize,
              hairColor: parsed.hairColor || initialCreator.measurements.hairColor,
              skinTone: parsed.skinTone || initialCreator.measurements.skinTone,
              tattoos: parsed.tattoos || initialCreator.measurements.tattoos
            },
            preferences: {
              ...initialCreator.preferences,
              comfortable: Array.isArray(parsed.comfortable) ? parsed.comfortable : (parsed.comfortable ? parsed.comfortable.split(",").map((s: string) => s.trim()) : initialCreator.preferences.comfortable),
              uncomfortable: Array.isArray(parsed.uncomfortable) ? parsed.uncomfortable : (parsed.uncomfortable ? parsed.uncomfortable.split(",").map((s: string) => s.trim()) : initialCreator.preferences.uncomfortable)
            },
            reels: [
              parsed.reel1Url && { id: "r1", title: parsed.reel1Title || "Showreel 1", duration: parsed.reel1Duration || "2:30", url: parsed.reel1Url },
              parsed.reel2Url && { id: "r2", title: parsed.reel2Title || "Showreel 2", duration: parsed.reel2Duration || "1:30", url: parsed.reel2Url }
            ].filter(Boolean)
          };
          setCurrentCreator(mapped);
        } catch (e) {
          console.error("Failed to parse stored talent profile", e);
        }
      }
    }
  }, [id]);

  // Form & Interaction states
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitted" | "approved">("idle");
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: creator.fullName,
    stageName: creator.stageName,
    location: creator.location,
    dayRate: Number(creator.dayRate),
    languages: creator.languages.join(", "),
    bio: creator.bio,
    height: creator.measurements.height,
    weight: creator.measurements.weight,
    chest: creator.measurements.chest,
    waist: creator.measurements.waist,
    hip: creator.measurements.hip,
    shoeSize: creator.measurements.shoeSize,
    hairColor: creator.measurements.hairColor,
    skinTone: creator.measurements.skinTone,
    tattoos: creator.measurements.tattoos,
    instagram: creator.instagram,
    youtube: creator.youtube,
    linkedin: creator.linkedin,
    comfortable: [...creator.preferences.comfortable],
    uncomfortable: [...creator.preferences.uncomfortable],
    hideMeasurements: creator.privacy?.hideMeasurements || false,
    hideDayRate: creator.privacy?.hideDayRate || false,
    restrictDms: creator.privacy?.restrictDms || false,
    noIndex: creator.privacy?.noIndex || false,
    category: creator.category,
    verifiedLevel: creator.verifiedLevel || "Premium",
    availability: creator.availability || "Available",
    followers: Number(creator.followers),
    engagementRate: creator.engagementRate || "8.2%",
    reel1Title: creator.reels[0]?.title || "Showreel 1",
    reel1Duration: creator.reels[0]?.duration || "2:30",
    reel1Url: creator.reels[0]?.url || "",
    reel2Title: creator.reels[1]?.title || "Showreel 2",
    reel2Duration: creator.reels[1]?.duration || "1:30",
    reel2Url: creator.reels[1]?.url || "",
    galleryUrls: creator.gallery.join(", ")
  });

  // Dynamically synchronize editForm state whenever the edit modal opens or currentCreator changes
  useEffect(() => {
    if (isEditOpen) {
      setEditForm({
        fullName: currentCreator.fullName,
        stageName: currentCreator.stageName,
        location: currentCreator.location,
        dayRate: Number(currentCreator.dayRate),
        languages: currentCreator.languages.join(", "),
        bio: currentCreator.bio,
        height: currentCreator.measurements.height,
        weight: currentCreator.measurements.weight,
        chest: currentCreator.measurements.chest,
        waist: currentCreator.measurements.waist,
        hip: currentCreator.measurements.hip,
        shoeSize: currentCreator.measurements.shoeSize,
        hairColor: currentCreator.measurements.hairColor,
        skinTone: currentCreator.measurements.skinTone,
        tattoos: currentCreator.measurements.tattoos,
        instagram: currentCreator.instagram,
        youtube: currentCreator.youtube,
        linkedin: currentCreator.linkedin,
        comfortable: [...currentCreator.preferences.comfortable],
        uncomfortable: [...currentCreator.preferences.uncomfortable],
        hideMeasurements: currentCreator.privacy?.hideMeasurements || false,
        hideDayRate: currentCreator.privacy?.hideDayRate || false,
        restrictDms: currentCreator.privacy?.restrictDms || false,
        noIndex: currentCreator.privacy?.noIndex || false,
        category: currentCreator.category,
        verifiedLevel: currentCreator.verifiedLevel || "Premium",
        availability: currentCreator.availability || "Available",
        followers: Number(currentCreator.followers),
        engagementRate: currentCreator.engagementRate || "8.2%",
        reel1Title: currentCreator.reels[0]?.title || "Showreel 1",
        reel1Duration: currentCreator.reels[0]?.duration || "2:30",
        reel1Url: currentCreator.reels[0]?.url || "",
        reel2Title: currentCreator.reels[1]?.title || "Showreel 2",
        reel2Duration: currentCreator.reels[1]?.duration || "1:30",
        reel2Url: currentCreator.reels[1]?.url || "",
        galleryUrls: currentCreator.gallery.join(", ")
      });
    }
  }, [isEditOpen, currentCreator]);

  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentCreator({
      ...currentCreator,
      fullName: editForm.fullName,
      stageName: editForm.stageName,
      location: editForm.location,
      dayRate: Number(editForm.dayRate),
      languages: editForm.languages.split(",").map((s: string) => s.trim()).filter(Boolean),
      bio: editForm.bio,
      instagram: editForm.instagram,
      youtube: editForm.youtube,
      linkedin: editForm.linkedin,
      category: editForm.category,
      verifiedLevel: editForm.verifiedLevel,
      availability: editForm.availability,
      followers: Number(editForm.followers),
      engagementRate: editForm.engagementRate,
      measurements: {
        ...currentCreator.measurements,
        height: editForm.height,
        weight: editForm.weight,
        chest: editForm.chest,
        waist: editForm.waist,
        hip: editForm.hip,
        shoeSize: editForm.shoeSize,
        hairColor: editForm.hairColor,
        skinTone: editForm.skinTone,
        tattoos: editForm.tattoos
      },
      preferences: {
        ...currentCreator.preferences,
        comfortable: [...editForm.comfortable],
        uncomfortable: [...editForm.uncomfortable]
      },
      privacy: {
        hideMeasurements: editForm.hideMeasurements,
        hideDayRate: editForm.hideDayRate,
        restrictDms: editForm.restrictDms,
        noIndex: editForm.noIndex
      },
      reels: [
        { id: "r1", title: editForm.reel1Title, duration: editForm.reel1Duration, url: editForm.reel1Url },
        { id: "r2", title: editForm.reel2Title, duration: editForm.reel2Duration, url: editForm.reel2Url }
      ].filter(r => r.url),
      gallery: editForm.galleryUrls.split(",").map((s: string) => s.trim()).filter(Boolean)
    });
    setIsEditOpen(false);
    toast({
      title: "Profile Updated!",
      description: "Your advanced talent castings profile details have been saved."
    });
  };

  const [bookingForm, setBookingForm] = useState({
    projectName: "",
    shootDate: "2026-06-15",
    location: "Kochi, Kerala",
    budget: "350000",
    requirements: "Lead role in television commercial.",
    notes: "Requires formal wardrobe options.",
    deliverables: "1 day shoot, 2 main campaign video files.",
    travelRequired: true,
    accommodationRequired: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReelUrl, setActiveReelUrl] = useState<string | null>(creator.reels[0]?.url || null);

  const handleBookingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsBookOpen(false);
      setBookingStatus("submitted");
      toast({
        title: "Booking Request Sent!",
        description: `Your request for "${creator.fullName}" has been submitted to scheduling.`
      });

      // Simulate manager approval auto action after 5 seconds
      setTimeout(() => {
        setBookingStatus("approved");
        toast({
          title: "Booking Approved!",
          description: `Internal manager approved "${creator.fullName}" for project "${bookingForm.projectName}". Calendar locked.`
        });
      }, 5000);
    }, 1500);
  };

  const handleSaveProfile = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from Shortlist" : "Added to Shortlist",
      description: isSaved 
        ? `"${creator.fullName}" removed from your talent shortlist.`
        : `"${creator.fullName}" saved to your shortlist.`
    });
  };

  const handleShareProfile = () => {
    setIsShareOpen(true);
  };

  const handleDownloadPdf = () => {
    setIsPdfOpen(true);
    toast({
      title: "Generating PDF Portfolio",
      description: "Preparing your premium castings card lookbook..."
    });
  };

  const triggerPdfDownload = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to download and print the lookbook PDF."
      });
      return;
    }

    const lookbookPicsHtml = creator.gallery.map((img: string) => `
      <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; aspect-ratio: 3/4; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `).join("");

    const comfortableHtml = creator.preferences.comfortable.map((c: string) => `
      <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.06); color: #059669; border: 1px solid rgba(16, 185, 129, 0.15); padding: 4px 10px; border-radius: 9999px; font-size: 9px; font-weight: bold; margin-bottom: 4px; margin-right: 4px;">
        ✓ ${c}
      </span>
    `).join("");

    const uncomfortableHtml = creator.preferences.uncomfortable.map((uc: string) => `
      <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.06); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.15); padding: 4px 10px; border-radius: 9999px; font-size: 9px; font-weight: bold; margin-bottom: 4px; margin-right: 4px;">
        ✕ ${uc}
      </span>
    `).join("");

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${creator.fullName} - Portfolio Lookbook</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
          }
          body {
            color: #1e293b;
            background: #fff;
            padding: 40px;
            font-size: 11px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          .title-area {
            max-width: 60%;
          }
          h1 {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.05em;
            line-height: 1.1;
          }
          .category {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 800;
            color: #ef4444;
            letter-spacing: 0.15em;
            margin-top: 5px;
            margin-bottom: 15px;
            display: block;
          }
          .bio {
            color: #475569;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.6;
          }
          .profile-pic-container {
            width: 140px;
            height: 160px;
            border-radius: 16px;
            overflow: hidden;
            border: 4px solid #fff;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          }
          .profile-pic {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #94a3b8;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .metric-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .metric-label {
            font-size: 8px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .metric-value {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
          }
          .lookbook-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .timeline-container {
            margin-top: 20px;
          }
          .timeline-graph {
            height: 25px;
            background: #f1f5f9;
            border-radius: 9999px;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 0 15px;
            font-weight: 800;
            font-size: 10px;
            color: #475569;
            position: relative;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
          }
          .timeline-fill {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: #0f172a;
            border-radius: 9999px;
            z-index: 1;
            transition: width 1s ease-in-out;
          }
          .timeline-text {
            position: relative;
            z-index: 2;
            color: #fff;
          }
          .timeline-markers {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
            margin-top: 6px;
            padding: 0 10px;
          }
          footer {
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 55px;
            font-weight: 900;
            color: rgba(15, 23, 42, 0.04);
            white-space: nowrap;
            z-index: -1;
            pointer-events: none;
            text-transform: uppercase;
            letter-spacing: 0.25em;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="watermark">Define Perspective</div>
        <header>
          <div class="title-area">
            <h1>${creator.fullName}</h1>
            <span class="category">${creator.category} &bull; ${creator.location}</span>
            <p class="bio">${creator.bio}</p>
            <div style="margin-top: 12px; display: flex; gap: 15px;">
              <a href="https://instagram.com/${creator.stageName.toLowerCase()}" style="display: inline-flex; align-items: center; gap: 4px; color: #ef4444; font-weight: bold; text-decoration: none; font-size: 9px;" target="_blank">
                Instagram: ${creator.instagram}
              </a>
              <a href="https://youtube.com" style="display: inline-flex; align-items: center; gap: 4px; color: #ef4444; font-weight: bold; text-decoration: none; font-size: 9px;" target="_blank">
                YouTube: ${creator.youtube}
              </a>
              <a href="https://linkedin.com" style="display: inline-flex; align-items: center; gap: 4px; color: #ef4444; font-weight: bold; text-decoration: none; font-size: 9px;" target="_blank">
                LinkedIn: ${creator.linkedin}
              </a>
            </div>
          </div>
          <div class="profile-pic-container">
            <img class="profile-pic" src="${creator.avatarUrl}" />
          </div>
        </header>

        <div class="two-column">
          <div>
            <h3 class="section-title">Physical Appearance & Measurements</h3>
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="metric-label">Height</span>
                <span class="metric-value">${creator.measurements.height}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Weight</span>
                <span class="metric-value">${creator.measurements.weight}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Waist</span>
                <span class="metric-value">${creator.measurements.waist}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Chest</span>
                <span class="metric-value">${creator.measurements.chest}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Hip</span>
                <span class="metric-value">${creator.measurements.hip}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Skin Tone</span>
                <span class="metric-value">${creator.measurements.skinTone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="section-title">Casting Preferences & Comfort</h3>
            <div style="margin-bottom: 15px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 5px;">Comfortable With</span>
              <div>${comfortableHtml}</div>
            </div>
            <div>
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 5px;">Not Comfortable With</span>
              <div>${uncomfortableHtml}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="section-title">Lala Look Book Portfolio</h3>
          <div class="lookbook-grid">
            ${lookbookPicsHtml}
          </div>
        </div>

        <div class="timeline-container">
          <h3 class="section-title">Milestone Timeline (Experience)</h3>
          <div class="timeline-graph">
            <div class="timeline-fill" style="width: 80%;"></div>
            <span class="timeline-text">${creator.experience}</span>
          </div>
          <div class="timeline-markers">
            <span>2016 (Debut)</span>
            <span>2020 (Mid Career)</span>
            <span>2026 (Premium Present)</span>
          </div>
        </div>

        <footer>
          <span>DEFINE PERSPECTIVE MEDIA OS V.1 &bull; CASTING AGENCY LOOKBOOK</span>
          <span>SECURE DIGITAL IDENTITY LOCK</span>
        </footer>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
    setIsPdfOpen(false);
    toast({
      title: "Interactive PDF Created",
      description: "Successfully prepared premium lookbook document."
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased pb-20 selection:bg-red-500 selection:text-white">
      
      {/* Dynamic Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden border-b border-slate-200">
        <img src={creator.bannerUrl} alt="banner" className="object-cover h-full w-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f5f7] via-[#f5f5f7]/20 to-transparent" />
        
        <div className="absolute top-6 left-6 z-10">
          <a href="/creators">
            <Button className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-full h-10 px-4 text-xs gap-1.5 shadow-sm font-bold transition">
              <ArrowLeft className="h-4 w-4" /> Back to Creators
            </Button>
          </a>
        </div>
      </div>

      {/* Creator Profile Section */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Side Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-6">
              
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg ring-4 ring-slate-100">
                  <AvatarImage src={creator.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-900 font-bold">{creator.stageName[0]}</AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{creator.fullName}</h2>
                    {creator.verifiedLevel === "Premium" && (
                      <Badge className="bg-red-500/10 text-red-650 border-none text-[8px] font-bold uppercase py-0.5 px-2 rounded-full">Premium</Badge>
                    )}
                  </div>
                  <span className="text-xs text-red-600 font-bold tracking-widest uppercase">{creator.category}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <MapPin className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                  <span>{creator.location}</span>
                </div>
              </div>

              {/* Engagement Stats (Phase 4) */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-150 py-5 text-center text-xs">
                <div className="border-r border-slate-150 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Reach</span>
                  <strong className="text-slate-950 font-black text-sm">{(creator.followers / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Engagement</span>
                  <strong className="text-red-600 font-black text-sm">{creator.engagementRate}</strong>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="space-y-3.5 text-xs text-slate-650 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Day Rate</span>
                  <strong className="text-slate-950">
                    {creator.privacy?.hideDayRate ? "🔒 Quote Required" : `₹${creator.dayRate.toLocaleString()}`}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Languages</span>
                  <strong className="text-slate-950">{creator.languages.join(", ")}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Availability</span>
                  <span className={creator.availability === "Available" ? "text-emerald-600" : "text-amber-600"}>{creator.availability}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="space-y-3 pt-2">
                <Button 
                  onClick={() => setIsBookOpen(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1.5 shadow shadow-red-500/10 transition"
                >
                  <CalendarDays className="h-4 w-4" /> Book Talent
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleSaveProfile}
                    className={`border-slate-200 bg-white hover:bg-slate-50 font-bold h-10 rounded-full text-xs gap-1.5 shadow-sm transition ${
                      isSaved ? "text-red-600 border-red-500/30" : "text-slate-700"
                    }`}
                  >
                    <Bookmark className="h-4 w-4" /> {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleShareProfile}
                    className="border-slate-200 bg-white hover:bg-slate-50 font-bold h-10 rounded-full text-xs gap-1.5 text-slate-700 shadow-sm transition"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>

                {/* PDF Download Trigger (Phase 6) */}
                <Button 
                  onClick={handleDownloadPdf}
                  variant="ghost"
                  className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1.5 shadow-sm transition bg-white"
                >
                  <FileDown className="h-4 w-4 text-red-650" /> Download PDF Portfolio
                </Button>

                {/* Edit Profile Details Button */}
                <Button 
                  onClick={() => setIsEditOpen(true)}
                  variant="outline"
                  className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1.5 shadow-sm transition bg-white"
                >
                  <UserCheck className="h-4 w-4 text-red-650" /> Edit Profile Details
                </Button>
              </div>

              {/* Social Channels */}
              <div className="pt-2 flex items-center justify-center gap-4 border-t border-slate-100">
                <a href="#" className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                  <Instagram className="h-4.5 w-4.5" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                  <Youtube className="h-4.5 w-4.5" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
              </div>

            </CardContent>
          </Card>

          {/* AI Suggestions Panel (Phase 8) */}
          <Card className="bg-red-500/5 border border-red-500/10 rounded-3xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-widest text-red-650 flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5 text-red-600 animate-pulse" /> AI Profile Insights
              </h3>
              <div className="space-y-3 text-[11px] font-bold text-slate-700">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex gap-2">
                  <Info className="h-4 w-4 shrink-0 text-red-600" />
                  <p className="leading-snug">Add measurements to improve your casting visibility by 40%.</p>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex gap-2">
                  <Info className="h-4 w-4 shrink-0 text-red-600" />
                  <p className="leading-snug">Fashion creators with 10+ photos get booked more frequently.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Portfolio Visuals */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Visual Reel Player */}
          {activeReelUrl && (
            <Card className="bg-slate-900 border border-slate-200 overflow-hidden rounded-3xl shadow-sm">
              <CardContent className="p-0 relative aspect-video bg-black">
                <video 
                  src={activeReelUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </CardContent>
            </Card>
          )}

          {/* Tab Menu Options */}
          <Tabs defaultValue="reels" className="space-y-6">
            <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-full shadow-sm">
              <TabsTrigger value="reels" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition">Videos</TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition">Lookbook</TabsTrigger>
              <TabsTrigger value="measurements" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition">Measurements</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition">Preferences</TabsTrigger>
              <TabsTrigger value="about" className="rounded-full text-xs font-bold px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition">About</TabsTrigger>
            </TabsList>

            {/* Reels Tab */}
            <TabsContent value="reels" className="space-y-4 outline-none">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Featured Campaigns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creator.reels.map((reel: any) => (
                  <div 
                    key={reel.id} 
                    onClick={() => setActiveReelUrl(reel.url)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-sm ${
                      activeReelUrl === reel.url 
                        ? "bg-red-500/5 border-red-500/30" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className={`h-8 w-8 ${activeReelUrl === reel.url ? "text-red-600" : "text-slate-400"}`} />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{reel.title}</h4>
                        <span className="text-[10px] text-slate-400 font-bold">{reel.duration} mins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Campaign Lookbook Tab */}
            <TabsContent value="gallery" className="space-y-4 outline-none">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Campaign Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {creator.gallery.map((img: string, idx: number) => (
                  <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 relative group shadow-sm bg-white">
                    <img src={img} alt="portfolio card" className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* PHYSICAL MEASUREMENTS TAB (Phase 2) */}
            <TabsContent value="measurements" className="space-y-4 outline-none">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Measurements</h3>
              <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                {creator.privacy?.hideMeasurements ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <ShieldAlert className="h-10 w-10 text-red-650 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">Measurements are private</span>
                    <p className="text-[10px] text-slate-450 max-w-sm font-medium">
                      This creator has kept their measurements private. Please contact our managers to view them.
                    </p>
                  </div>
                ) : (
                  <CardContent className="p-0 grid grid-cols-2 md:grid-cols-3 gap-6 font-bold text-xs text-slate-800">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-405 block uppercase">Height</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.height}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-405 block uppercase">Weight</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.weight}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-405 block uppercase">Chest</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.chest}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className="text-[9px] text-slate-405 block uppercase">Waist</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.waist}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className="text-[9px] text-slate-405 block uppercase">Hip</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.hip}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className="text-[9px] text-slate-405 block uppercase">Shoe Size</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.shoeSize}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <span className="text-[9px] text-slate-405 block uppercase">Hair Color</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.hairColor}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <span className="text-[9px] text-slate-405 block uppercase">Skin Tone</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.skinTone}</strong>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <span className="text-[9px] text-slate-405 block uppercase">Tattoos</span>
                      <strong className="text-slate-900 text-sm">{creator.measurements.tattoos}</strong>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* PREFERENCES TAB (Phase 3) */}
            <TabsContent value="preferences" className="space-y-6 outline-none">
              
              {/* Comfortable List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Comfortable Available For</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.preferences.comfortable.map((c: string) => (
                    <Badge key={c} className="bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 text-[9px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1 shadow-sm">
                      <Check className="h-3 w-3" /> {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Not Comfortable List */}
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Not Comfortable With</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.preferences.uncomfortable.map((uc: string) => (
                    <Badge key={uc} className="bg-red-500/5 text-red-600 border border-red-500/10 text-[9px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1 shadow-sm">
                      <X className="h-3.5 w-3.5" /> {uc}
                    </Badge>
                  ))}
                </div>
              </div>

            </TabsContent>

            {/* Bio Info Tab */}
            <TabsContent value="about" className="space-y-6 outline-none">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-red-650">About {creator.fullName}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">{creator.bio}</p>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-red-650">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {creator.skills.map((s: string) => (
                      <Badge key={s} className="bg-slate-50 border border-slate-100 text-slate-700 font-bold text-[9px] py-1 px-3 rounded-full">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-2 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-red-650">Experience</h4>
                  <div className="space-y-2">
                    <p className="text-slate-600 flex items-center gap-1 font-bold">
                      <Award className="h-4 w-4 text-red-650" /> {creator.experience}
                    </p>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>

        </div>

      </div>

      {/* Booking Form Modal */}
      <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
        <DialogContent className="bg-white text-[#1d1d1f] border-slate-200 rounded-3xl p-6 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1">
              <Zap className="h-5 w-5 text-red-650" /> Send Booking Request
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-bold leading-normal">
              Fill out the campaign shoot details below to propose a shoot contract.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingRequest} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Project Name</label>
              <Input 
                type="text" 
                value={bookingForm.projectName}
                onChange={(e) => setBookingForm({ ...bookingForm, projectName: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                placeholder="e.g. Pulse Energy Summer TVC"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Shoot Date</label>
                <Input 
                  type="date" 
                  value={bookingForm.shootDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, shootDate: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs h-10 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Location</label>
                <Input 
                  type="text" 
                  value={bookingForm.location}
                  onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Proposed Budget (₹)</label>
                <Input 
                  type="number" 
                  value={bookingForm.budget}
                  onChange={(e) => setBookingForm({ ...bookingForm, budget: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Deliverables</label>
                <Input 
                  type="text" 
                  value={bookingForm.deliverables}
                  onChange={(e) => setBookingForm({ ...bookingForm, deliverables: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Requirements & Notes</label>
              <textarea 
                value={bookingForm.requirements}
                onChange={(e) => setBookingForm({ ...bookingForm, requirements: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-805 rounded-xl text-xs h-16 w-full p-2.5 outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-[10px] font-bold text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={bookingForm.travelRequired}
                  onChange={(e) => setBookingForm({ ...bookingForm, travelRequired: e.target.checked })}
                  className="rounded border-slate-350 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                Travel Required?
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={bookingForm.accommodationRequired}
                  onChange={(e) => setBookingForm({ ...bookingForm, accommodationRequired: e.target.checked })}
                  className="rounded border-slate-350 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                Accommodation?
              </label>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsBookOpen(false)} className="rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-bold bg-white text-slate-700 h-10 shadow-sm transition">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold h-10 px-5 shadow shadow-red-500/10 transition">
                {isSubmitting ? "Sending Request..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PDF Lookbook Share Preview Modal (Phase 6) */}
      <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-3xl p-6 max-w-sm font-sans">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-slate-900">
              <FileDown className="h-5 w-5 text-red-650" /> PDF Portfolio Lookbook
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-450 font-bold">
              Premium casting lookbook generated successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs font-bold">
            <div className="border border-slate-200 p-4 bg-slate-50/50 rounded-2xl flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-slate-150 shadow shrink-0">
                <AvatarImage src={creator.avatarUrl} className="object-cover" />
                <AvatarFallback>{creator.stageName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-slate-900 font-bold leading-tight">{creator.fullName}</h4>
                <span className="text-[10px] text-red-605 font-bold uppercase tracking-widest">{creator.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-650 bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div>Height: <strong>{creator.measurements.height}</strong></div>
              <div>Weight: <strong>{creator.measurements.weight}</strong></div>
              <div>Waist: <strong>{creator.measurements.waist}</strong></div>
              <div>Chest: <strong>{creator.measurements.chest}</strong></div>
            </div>
            
            {/* Share QR Simulation */}
            <div className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl gap-3">
              <QrCode className="h-12 w-12 text-slate-800 shrink-0" />
              <div className="text-[9px] text-slate-400 font-medium">
                Scan QR to view interactive digital reel and lock bookings on DP Media OS.
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button onClick={triggerPdfDownload} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold h-11 shadow-sm transition">
              Download Lookbook PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Sharing Infrastructure Modal (Phase 6) */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-3xl p-6 max-w-sm font-sans">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-slate-900">
              <Share2 className="h-5 w-5 text-red-650" /> Share Creator Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-450 font-bold">
              Dispatch this premium castings card lookbook to brands or agencies.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs font-bold">
            <div className="grid grid-cols-1 gap-2">
              {/* WhatsApp Share */}
              <Button 
                onClick={() => {
                  window.open(`https://api.whatsapp.com/send?text=Check out ${creator.fullName}'s premium portfolio lookbook on Define Perspective: ${window.location.href}`, "_blank");
                  setIsShareOpen(false);
                  toast({ title: "WhatsApp Redirected", description: "Opening WhatsApp chat..." });
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="h-4 w-4" /> Share on WhatsApp
              </Button>

              {/* LinkedIn Share */}
              <Button 
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
                  setIsShareOpen(false);
                  toast({ title: "LinkedIn Opened", description: "Opening LinkedIn share tab..." });
                }}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 transition"
              >
                <Linkedin className="h-4 w-4" /> Share on LinkedIn
              </Button>

              {/* Copy Direct Link */}
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setIsShareOpen(false);
                  toast({
                    title: "Link Copied!",
                    description: "Direct profile portfolio URL copied to clipboard."
                  });
                }}
                variant="outline"
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 transition bg-white"
              >
                <Check className="h-4 w-4 text-red-650" /> Copy Profile Link
              </Button>
            </div>

            {/* Profile QR Code */}
            <div className="border border-slate-150 p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 text-center">
              <QrCode className="h-20 w-20 text-slate-800" />
              <span className="text-[9px] text-slate-400 font-medium">
                Direct QR Code to mobile portfolio lookbook.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsShareOpen(false)} variant="ghost" className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full text-xs font-bold h-10 transition bg-white shadow-sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Details Modal (Phase 1, 2, 3, 4) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-3xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-slate-900">
              <UserCheck className="h-5 w-5 text-red-650" /> Edit Talent Profile Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-450 font-bold">
              Update your physical measurements, acting comfort levels, and social reach metrics.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfileEdits} className="space-y-6 pt-3">
            
            {/* Section 1: Basic Identity */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Basic Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Full Name</label>
                  <Input 
                    type="text" 
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Stage Name</label>
                  <Input 
                    type="text" 
                    value={editForm.stageName}
                    onChange={(e) => setEditForm({ ...editForm, stageName: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">City & Country Location</label>
                  <Input 
                    type="text" 
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Day Rate (₹)</label>
                  <Input 
                    type="number" 
                    value={editForm.dayRate}
                    onChange={(e) => setEditForm({ ...editForm, dayRate: Number(e.target.value) })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Bio Description</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-805 rounded-xl text-xs h-16 w-full p-2.5 outline-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Category</label>
                  <Input 
                    type="text" 
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Verified Level</label>
                  <select 
                    value={editForm.verifiedLevel}
                    onChange={(e) => setEditForm({ ...editForm, verifiedLevel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 px-2 font-bold outline-none"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Availability</label>
                  <select 
                    value={editForm.availability}
                    onChange={(e) => setEditForm({ ...editForm, availability: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 px-2 font-bold outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Reach (Total Followers, e.g. 7800000)</label>
                  <Input 
                    type="number" 
                    value={editForm.followers}
                    onChange={(e) => setEditForm({ ...editForm, followers: Number(e.target.value) })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Engagement Rate (e.g. 8.2%)</label>
                  <Input 
                    type="text" 
                    value={editForm.engagementRate}
                    onChange={(e) => setEditForm({ ...editForm, engagementRate: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Languages spoken (comma separated)</label>
                <Input 
                  type="text" 
                  value={editForm.languages}
                  onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  required
                />
              </div>
            </div>

            {/* Section 2: Physical Appearance (Phase 2) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Physical Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Height (e.g. 185 cm)</label>
                  <Input 
                    type="text" 
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Weight (e.g. 78 kg)</label>
                  <Input 
                    type="text" 
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Chest (e.g. 40 in)</label>
                  <Input 
                    type="text" 
                    value={editForm.chest}
                    onChange={(e) => setEditForm({ ...editForm, chest: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Waist (e.g. 32 in)</label>
                  <Input 
                    type="text" 
                    value={editForm.waist}
                    onChange={(e) => setEditForm({ ...editForm, waist: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Hip (e.g. 38 in)</label>
                  <Input 
                    type="text" 
                    value={editForm.hip}
                    onChange={(e) => setEditForm({ ...editForm, hip: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Shoe Size</label>
                  <Input 
                    type="text" 
                    value={editForm.shoeSize}
                    onChange={(e) => setEditForm({ ...editForm, shoeSize: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Hair Color</label>
                  <Input 
                    type="text" 
                    value={editForm.hairColor}
                    onChange={(e) => setEditForm({ ...editForm, hairColor: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Skin Tone</label>
                  <Input 
                    type="text" 
                    value={editForm.skinTone}
                    onChange={(e) => setEditForm({ ...editForm, skinTone: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Tattoo Details</label>
                  <Input 
                    type="text" 
                    value={editForm.tattoos}
                    onChange={(e) => setEditForm({ ...editForm, tattoos: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Social Links (Phase 4) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Social Media Channels</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Instagram</label>
                  <Input 
                    type="text" 
                    value={editForm.instagram}
                    onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">YouTube</label>
                  <Input 
                    type="text" 
                    value={editForm.youtube}
                    onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">LinkedIn</label>
                  <Input 
                    type="text" 
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs h-10 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Content Preference Toggles (Phase 3) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Campaign Preferences</h3>
              
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Comfortable With</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] text-slate-700 font-bold">
                  {[
                    "Western Wear", "Traditional Wear", "Corporate Ads", 
                    "Action Sequences", "Night Shoots", "Live Hosting", 
                    "Brand Collaborations", "Travel Videos", "Comedy Content", "Couple Shoots"
                  ].map((option) => {
                    const isChecked = editForm.comfortable.includes(option);
                    return (
                      <label key={option} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newComfortable = e.target.checked
                              ? [...editForm.comfortable, option]
                              : editForm.comfortable.filter(c => c !== option);
                            setEditForm({ ...editForm, comfortable: newComfortable });
                          }}
                          className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Not Comfortable With</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] text-slate-700 font-bold">
                  {[
                    "Smoking Scenes", "Alcohol Promotions", "Political Campaigns", 
                    "Religious Campaigns", "Intimate Scenes", "Late Night Shoots", 
                    "Heavy Makeup", "Horror Content"
                  ].map((option) => {
                    const isChecked = editForm.uncomfortable.includes(option);
                    return (
                      <label key={option} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newUncomfortable = e.target.checked
                              ? [...editForm.uncomfortable, option]
                              : editForm.uncomfortable.filter(uc => uc !== option);
                            setEditForm({ ...editForm, uncomfortable: newUncomfortable });
                          }}
                          className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 5: Creator Privacy & Protection Controls */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Creator Privacy Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-700 font-bold">
                
                {/* Hide Measurements */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                  <input 
                    type="checkbox"
                    checked={editForm.hideMeasurements}
                    onChange={(e) => setEditForm({ ...editForm, hideMeasurements: e.target.checked })}
                    className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <span className="block">Hide Physical Measurements</span>
                    <span className="text-[8px] text-slate-450 font-normal">Restricts discoverability to direct manager requests.</span>
                  </div>
                </label>

                {/* Hide Day Rate */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                  <input 
                    type="checkbox"
                    checked={editForm.hideDayRate}
                    onChange={(e) => setEditForm({ ...editForm, hideDayRate: e.target.checked })}
                    className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <span className="block">Hide Financial Day Rate</span>
                    <span className="text-[8px] text-slate-450 font-normal">Require custom quotes on booking intents.</span>
                  </div>
                </label>

                {/* Restrict Direct Messaging */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                  <input 
                    type="checkbox"
                    checked={editForm.restrictDms}
                    onChange={(e) => setEditForm({ ...editForm, restrictDms: e.target.checked })}
                    className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <span className="block">Restrict Direct Messaging</span>
                    <span className="text-[8px] text-slate-450 font-normal">Requires agency review before forwarding inquiries.</span>
                  </div>
                </label>

                {/* Exclude from search index */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:bg-slate-100 transition shadow-sm">
                  <input 
                    type="checkbox"
                    checked={editForm.noIndex}
                    onChange={(e) => setEditForm({ ...editForm, noIndex: e.target.checked })}
                    className="rounded border-slate-300 text-red-650 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <span className="block">No Search Indexing</span>
                    <span className="text-[8px] text-slate-450 font-normal">Block search engine visibility and crawler tags.</span>
                  </div>
                </label>

              </div>
            </div>

            {/* Section 6: Video Reels & Showreels */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Video Reels</h3>
              
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Reel 1 Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Reel 1 Title</label>
                    <Input 
                      type="text" 
                      value={editForm.reel1Title}
                      onChange={(e) => setEditForm({ ...editForm, reel1Title: e.target.value })}
                      className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Duration (e.g. 2:45)</label>
                    <Input 
                      type="text" 
                      value={editForm.reel1Duration}
                      onChange={(e) => setEditForm({ ...editForm, reel1Duration: e.target.value })}
                      className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Reel 1 MP4 Video URL</label>
                  <Input 
                    type="text" 
                    value={editForm.reel1Url}
                    onChange={(e) => setEditForm({ ...editForm, reel1Url: e.target.value })}
                    className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Reel 2 Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Reel 2 Title</label>
                    <Input 
                      type="text" 
                      value={editForm.reel2Title}
                      onChange={(e) => setEditForm({ ...editForm, reel2Title: e.target.value })}
                      className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Duration (e.g. 1:30)</label>
                    <Input 
                      type="text" 
                      value={editForm.reel2Duration}
                      onChange={(e) => setEditForm({ ...editForm, reel2Duration: e.target.value })}
                      className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">Reel 2 MP4 Video URL</label>
                  <Input 
                    type="text" 
                    value={editForm.reel2Url}
                    onChange={(e) => setEditForm({ ...editForm, reel2Url: e.target.value })}
                    className="bg-white border border-slate-200 text-slate-850 rounded-xl text-xs h-9 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 7: Lookbook Photo Gallery */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Lookbook Photo Gallery</h3>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Lookbook Gallery Image URLs (comma separated)</label>
                <textarea 
                  value={editForm.galleryUrls}
                  onChange={(e) => setEditForm({ ...editForm, galleryUrls: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-805 rounded-xl text-xs h-20 w-full p-2.5 outline-none font-bold"
                  placeholder="Paste direct image URLs..."
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-bold bg-white text-slate-700 h-11 transition shadow-sm">
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold h-11 px-6 shadow shadow-red-500/10 transition">
                Save Profile Edits
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
