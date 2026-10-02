import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Download, CheckCircle2, RefreshCw, ArrowLeft, Archive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDownloadProfileLabel, type DownloadOptions } from "@/lib/download-options";

interface DownloadCompleteProps {
  playlistName: string;
  trackCount: number;
  onReset: () => void;
  onDownload: () => void;
  onRetryFailed: () => void;
  completedCount: number;
  failedCount: number;
  downloadOptions: DownloadOptions;
}

export const DownloadComplete: React.FC<DownloadCompleteProps> = ({
  playlistName,
  trackCount,
  onReset,
  onDownload,
  onRetryFailed,
  completedCount,
  failedCount,
  downloadOptions,
}) => {
  useEffect(() => {
    // Subtle celebration confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#ffffff"],
      });
    } catch {
      // Ignore confetti if canvas is not supported in the environment
    }
  }, []);

  const hasFailures = failedCount > 0;
  const estimatedSizePerTrack =
    downloadOptions.format === "mp3" ? (downloadOptions.quality === "320" ? 7 : 4) : downloadOptions.format === "flac" ? 22 : 35;
  const totalEstMb = Math.max(1, Math.round(completedCount * estimatedSizePerTrack));

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in py-8 text-center">
      {/* Success Icon */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-950/50">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {hasFailures ? "Download Ready with Misses" : "Download Ready!"}
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-sm">
          {hasFailures
            ? "Your archive has been created. Some tracks couldn't be found, but the rest are ready."
            : "All tracks were converted and packed into a ZIP archive."}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-[#131518] border border-[#23262c] rounded-2xl p-5 shadow-xl text-left space-y-3">
        <div className="flex items-center justify-between border-b border-[#202329] pb-3">
          <div className="min-w-0 pr-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider block">Playlist / Album</span>
            <span className="text-sm font-semibold text-white truncate block">
              {playlistName}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
            {getDownloadProfileLabel(downloadOptions)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#181a1f] border border-[#24272e] rounded-xl p-3">
            <span className="text-zinc-500 block mb-0.5">Completed Tracks</span>
            <span className="text-base font-bold text-white">
              {completedCount} <span className="text-xs font-normal text-zinc-500">/ {trackCount}</span>
            </span>
          </div>
          <div className="bg-[#181a1f] border border-[#24272e] rounded-xl p-3">
            <span className="text-zinc-500 block mb-0.5">Estimated Archive Size</span>
            <span className="text-base font-bold text-white">
              ~{totalEstMb} <span className="text-xs font-normal text-zinc-500">MB</span>
            </span>
          </div>
        </div>

        {hasFailures && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{failedCount} track(s) failed during conversion</span>
            </div>
            <button
              type="button"
              onClick={onRetryFailed}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all"
            >
              Retry Failed
            </button>
          </div>
        )}
      </div>

      {/* Main Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="download"
          size="xl"
          onClick={onDownload}
          className="w-full h-13 text-base shadow-xl"
        >
          <Download className="w-5 h-5 mr-2" />
          Download ZIP Archive ({completedCount} Songs)
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={onReset}
          className="w-full text-zinc-400 hover:text-white text-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Download Another Link
        </Button>
      </div>
    </div>
  );
};

export default DownloadComplete;
