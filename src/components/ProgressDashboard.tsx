import React from "react";
import { Loader2, XCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrackItem, { Track } from "@/components/TrackItem";
import { getDownloadProfileLabel, type DownloadOptions } from "@/lib/download-options";

interface ProgressDashboardProps {
  playlistName: string;
  tracks: Track[];
  currentIndex: number;
  onReset: () => void;
  downloadOptions: DownloadOptions;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  playlistName,
  tracks,
  currentIndex,
  onReset,
  downloadOptions,
}) => {
  const completedCount = tracks.filter((t) => t.status === "Completed").length;
  const failedCount = tracks.filter((t) => t.status === "Failed").length;
  const totalCount = tracks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const activeTrack = tracks[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in py-6">
      {/* Progress Header Card */}
      <div className="bg-[#131518] border border-[#23262c] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Downloading Playlist
            </span>
            <h2 className="text-xl font-bold text-white truncate">
              {playlistName || "Fetching Spotify info..."}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {completedCount} of {totalCount} tracks completed • Format: {getDownloadProfileLabel(downloadOptions)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-white">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Smooth Progress Bar */}
        <div className="w-full bg-[#1e2026] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>

        {/* Active Track Banner */}
        {activeTrack && (
          <div className="bg-[#181a1f] border border-[#262930] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate text-zinc-300">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
              <span className="text-zinc-500 shrink-0">Current:</span>
              <span className="font-medium text-white truncate">
                {activeTrack.name}
              </span>
            </div>
            <span className="text-zinc-500 shrink-0 text-[11px]">
              {currentIndex + 1} / {totalCount}
            </span>
          </div>
        )}
      </div>

      {/* Track List Container */}
      <div className="bg-[#131518] border border-[#23262c] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-semibold text-zinc-400">
          <span>Tracks ({tracks.length})</span>
          {failedCount > 0 && (
            <span className="text-red-400">{failedCount} failed</span>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
          {tracks.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Resolving tracks from Spotify...</span>
            </div>
          ) : (
            tracks.map((track, index) => (
              <TrackItem key={`${track.name}-${index}`} track={track} index={index} />
            ))
          )}
        </div>
      </div>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={onReset}
          className="rounded-xl px-5 text-xs font-medium"
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          Cancel Download
        </Button>
      </div>
    </div>
  );
};

export default ProgressDashboard;
