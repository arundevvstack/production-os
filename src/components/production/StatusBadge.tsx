import React from "react";

type StatusType = "Not Started" | "In Progress" | "Waiting Review" | "Approved" | "Completed" | "Blocked" | string;

export function StatusBadge({ status }: { status: StatusType }) {
  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "In Progress":
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "Waiting Review":
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "Approved":
    case "Completed":
      colorClasses = "bg-green-50 text-green-700 border-green-200";
      break;
    case "Blocked":
      colorClasses = "bg-red-50 text-red-700 border-red-200";
      break;
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${colorClasses}`}>
      {status}
    </span>
  );
}
