"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function HumanReviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [assets, setAssets] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Review State
  const [scores, setScores] = useState({
    quality: 80,
    brand: 80,
    continuity: 80,
    character_accuracy: 80,
    location_accuracy: 80,
    overall: 80
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPendingAssets();
  }, [projectId]);

  const fetchPendingAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets?status=Pending Review`);
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAsset = assets[currentIndex];
  const currentVersion = currentAsset?.ProductionAssetVersion?.[0];

  const submitReview = async (decision: string) => {
    if (!currentAsset || !currentVersion) return;

    try {
      await fetch(`/api/v1/projects/${projectId}/assets/${currentAsset.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: currentVersion.id,
          decision,
          scores,
          notes
        })
      });
      
      // Move to next asset
      if (currentIndex < assets.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset scores
        setScores({ quality: 80, brand: 80, continuity: 80, character_accuracy: 80, location_accuracy: 80, overall: 80 });
        setNotes("");
      } else {
        // We are done
        fetchPendingAssets();
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error("Failed to submit review", e);
    }
  };

  if (isLoading) return <div className="p-12 text-center">Loading pending reviews...</div>;

  if (assets.length === 0) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
        <p className="text-slate-500 mb-6">There are no assets pending human review.</p>
        <Button onClick={() => router.push(`/projects/${projectId}/assets`)}>Go to Asset Manager</Button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Human Review</h1>
          <p className="text-slate-500">Asset {currentIndex + 1} of {assets.length} Pending</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/assets`)}>Back to Assets</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Media Viewer */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-white dark:bg-slate-900 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{currentAsset.type} Generation</CardTitle>
                <p className="text-sm text-slate-500 mt-1">ID: {currentAsset.id}</p>
              </div>
              <Badge variant="secondary">Version {currentVersion?.version_number}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 bg-black/5 flex items-center justify-center relative">
            {currentVersion?.file_url ? (
              currentAsset.type.includes('Image') ? (
                <img src={currentVersion.file_url} className="max-h-full object-contain" />
              ) : (
                <video src={currentVersion.file_url} controls className="max-h-full" />
              )
            ) : (
              <span className="text-slate-400">Media not available</span>
            )}
          </CardContent>
        </Card>

        {/* Scoring Panel */}
        <Card className="flex flex-col h-full overflow-y-auto">
          <CardHeader>
            <CardTitle>Evaluation Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Context Info */}
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated With</span>
              <div className="text-sm"><strong>Provider:</strong> {currentVersion?.provider_id}</div>
              <div className="text-sm"><strong>Model:</strong> {currentVersion?.model_name}</div>
              <div className="text-sm"><strong>Prompt:</strong> {currentVersion?.metadata?.textContent || "N/A"}</div>
              {currentVersion?.metadata?.ai_review && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 border-t pt-2 border-blue-200">
                  AI Review Overall: {currentVersion.metadata.ai_review.overall}/100
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {Object.keys(scores).map((metric) => (
                <div key={metric} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{metric.replace('_', ' ')}</span>
                    <span>{(scores as any)[metric]}</span>
                  </div>
                  <Slider 
                    value={[(scores as any)[metric]]} 
                    max={100} 
                    step={1}
                    onValueChange={(val) => setScores({ ...scores, [metric]: val[0] })}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Reviewer Notes</span>
              <Textarea 
                placeholder="Enter feedback for rejection or revision..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <Button variant="destructive" className="w-full flex-col h-16" onClick={() => submitReview("Rejected")}>
                <XCircle className="h-5 w-5 mb-1" /> Reject
              </Button>
              <Button variant="outline" className="w-full flex-col h-16 text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => submitReview("Needs Revision")}>
                <AlertCircle className="h-5 w-5 mb-1" /> Revise
              </Button>
              <Button variant="default" className="w-full flex-col h-16 bg-green-600 hover:bg-green-700" onClick={() => submitReview("Approved")}>
                <CheckCircle2 className="h-5 w-5 mb-1" /> Approve
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
