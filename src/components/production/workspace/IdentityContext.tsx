"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useParams } from 'next/navigation';

export interface DigitalHuman {
  identityId: string;
  characterId: string;
  masterPortrait: string | null;
  identityMetadata: any;
  approvedAssets: Record<string, string>;
  pendingAssets: Record<string, string>;
  identityScore: number;
  health: {
    completionPercent: number;
    isIdentityLocked: boolean;
    referenceCoverage: number;
    storyboardReady: boolean;
    videoReady: boolean;
  };
}

interface IdentityState {
  digitalHumans: Record<string, DigitalHuman>;
  refreshIdentities: () => Promise<void>;
  isLoading: boolean;
}

const IdentityContext = createContext<IdentityState | undefined>(undefined);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const projectId = params?.id as string;
  
  const [digitalHumans, setDigitalHumans] = useState<Record<string, DigitalHuman>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshIdentities = async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/projects/${projectId}/characters`);
      if (!res.ok) return;
      
      const data = await res.json();
      const characters = Array.isArray(data) ? data : data.characters;
      
      if (!Array.isArray(characters)) {
         return;
      }
      
      const newHumans: Record<string, DigitalHuman> = {};
      
      characters.forEach((char: any) => {
        const m = (typeof char.metadata === 'string' ? JSON.parse(char.metadata) : char.metadata) || {};
        const assets = m.assets || {};
        const pendingAssets = m.pending_assets || {};
        const identity = m.identity || {};
        
        const masterPortrait = identity.master_image_url || assets['Master Portrait'] || char.reference_image_url || null;
        
        const assetKeys = Object.keys(assets);
        const completionPercent = Math.round((assetKeys.length / 8) * 100);
        
        const isIdentityLocked = !!identity.seed && !!masterPortrait;
        const storyboardReady = !!assets['Action Pose'] && !!masterPortrait;
        const videoReady = !!assets['Face Reference'] && !!masterPortrait;
        
        newHumans[char.id] = {
          identityId: char.id,
          characterId: char.id,
          masterPortrait,
          identityMetadata: identity,
          approvedAssets: assets,
          pendingAssets: pendingAssets,
          identityScore: identity.identity_score || 0,
          health: {
            completionPercent,
            isIdentityLocked,
            referenceCoverage: completionPercent,
            storyboardReady,
            videoReady
          }
        };
      });
      
      setDigitalHumans(newHumans);
    } catch (e) {
      console.error("Failed to load Digital Humans", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshIdentities();
  }, [projectId]);

  return (
    <IdentityContext.Provider value={{ digitalHumans, refreshIdentities, isLoading }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentityManager() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentityManager must be used within an IdentityProvider');
  }
  return context;
}
