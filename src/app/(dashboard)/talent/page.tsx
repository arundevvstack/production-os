"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TalentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/talents");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
