
"use client";

import { useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant";

/**
 * Dynamically injects CSS variables for theming, ensuring a fallback to default styles.
 */
export function ThemeSync() {
  const { settings, profile, isLoading } = useTenant();

  useEffect(() => {
    // Do not run the effect until the tenant data has finished loading.
    if (isLoading) {
      return;
    }

    const root = document.documentElement;
    // Prefer user's specific theme, fallback to workspace theme
    const theme = (profile?.theme_preference as any) || (settings?.theme as any);

    // Handle the primary color
    if (theme?.primary) {
      const hsl = hexToHsl(theme.primary);
      if (hsl) {
        root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      } else {
        // If hex is invalid, fall back to default by removing the property
        root.style.removeProperty('--primary');
      }
    } else {
      // If no custom primary color is set, ensure any previous custom property is removed
      // to allow the CSS-defined default to apply.
      root.style.removeProperty('--primary');
    }

    // Handle the accent color
    if (theme?.accent) {
      const hsl = hexToHsl(theme.accent);
      if (hsl) {
        root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      } else {
        root.style.removeProperty('--accent');
      }
    } else {
      root.style.removeProperty('--accent');
    }

    // Handle Dark Mode
    if (theme?.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

  }, [settings?.theme, profile?.theme_preference, isLoading]);

  return null;
}

/**
 * Utility to convert a Hex color string to an HSL object.
 * Returns null if the hex input is invalid.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (typeof hex !== 'string') return null;

  const sanitizedHex = hex.startsWith('#') ? hex.substring(1) : hex;

  let r = 0, g = 0, b = 0;
  
  if (sanitizedHex.length === 3) {
    r = parseInt(sanitizedHex[0].repeat(2), 16);
    g = parseInt(sanitizedHex[1].repeat(2), 16);
    b = parseInt(sanitizedHex[2].repeat(2), 16);
  } else if (sanitizedHex.length === 6) {
    r = parseInt(sanitizedHex.substring(0, 2), 16);
    g = parseInt(sanitizedHex.substring(2, 4), 16);
    b = parseInt(sanitizedHex.substring(4, 6), 16);
  } else {
    return null; // Invalid hex length
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null; // Invalid hex characters

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
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
