import React from "react";
import { Badge } from "@/components/ui/badge";

export type AssetStatus = "Pending" | "Generating" | "Processing" | "Completed" | "Failed" | "Approved";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  
  switch (status) {
    case "Completed":
    case "Approved":
      variant = "default";
      break;
    case "Failed":
      variant = "destructive";
      break;
    case "Processing":
    case "Generating":
      variant = "secondary";
      break;
    default:
      variant = "outline";
      break;
  }

  return (
    <Badge variant={variant} className={`shadow-sm ${className}`}>
      {status}
    </Badge>
  );
}
