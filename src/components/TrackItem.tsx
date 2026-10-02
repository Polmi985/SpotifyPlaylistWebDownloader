import React from "react";
import { Check, Loader2, X, Clock } from "lucide-react";

export type TrackStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface Track {
  id?: string;
  name: string;
  artist: string;
  status: TrackStatus;
}

interface TrackItemProps {
  track: Track;
  index: number;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track, index }) => {
  const currentStatus = track?.status || "Pending";

  const statusConfig = {
    Pending: {
      icon: Clock,
      color: "text-zinc-500",
      bg: "bg-zinc-800/40 text-zinc-400 border-zinc-700/40",
      text: "Waiting",
    },
    Processing: {
      icon: Loader2,
      color: "text-emerald-400 animate-spin",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      text: "Downloading",
    },
    Completed: {
      icon: Check,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      text: "Done",
    },
    Failed: {
      icon: X,
      color: "text-red-400",
      bg: "bg-red-500/10 text-red-400 border-red-500/20",
      text: "Failed",
    },
  }[currentStatus] || {
    icon: Clock,
    color: "text-zinc-500",
    bg: "bg-zinc-800 text-zinc-400 border-zinc-700",
    text: currentStatus,
  };

  const Icon = statusConfig.icon;
  const isProcessing = currentStatus === "Processing";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        isProcessing
          ? "bg-emerald-950/20 border-emerald-500/30 shadow-sm"
          : "bg-[#16181c] border-[#22242a] hover:border-[#2b2d35]"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-3">
        <span className="w-6 text-center text-xs font-mono text-zinc-500 shrink-0">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">
            {track?.name || "Unknown Track"}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {track?.artist || "Unknown Artist"}
          </p>
        </div>
      </div>

      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 ${statusConfig.bg}`}
      >
        <Icon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
        <span>{statusConfig.text}</span>
      </div>
    </div>
  );
};

export default TrackItem;