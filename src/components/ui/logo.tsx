import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
}

export function Logo({ className, variant = "full" }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-start", className)}>
      <Image 
        src="/logo.png" 
        alt="Define Perspective Logo"
        width={variant === "icon" ? 40 : 240}
        height={variant === "icon" ? 40 : 56}
        className={cn(
          "object-contain object-left",
          variant === "icon" ? "h-10 w-auto" : "h-14 w-auto max-w-[240px]"
        )}
        priority
      />
    </div>
  );
}
