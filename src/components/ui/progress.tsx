"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => {
  // Dynamic color transition based on value if no explicit color is provided
  const getDynamicColor = (val: number | null | undefined) => {
    if (indicatorColor) return indicatorColor;
    if (val === null || val === undefined) return "bg-primary";
    if (val < 40) return "bg-destructive"; // Red
    if (val < 75) return "bg-amber-500"; // Orange/Yellow
    return "bg-emerald-500"; // Green
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getDynamicColor(value))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
