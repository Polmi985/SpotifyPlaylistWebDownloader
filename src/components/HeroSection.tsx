import React, { useState, useEffect } from "react";
import { Download, Link2, Sparkles, Check, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FORMAT_PRESETS,
  normalizeDownloadOptions,
  type DownloadOptions,
  type Mp3Quality,
} from "@/lib/download-options";

interface HeroSectionProps {
  onSubmit: (url: string, options: DownloadOptions) => void;
  isProcessing: boolean;
  downloadOptions: DownloadOptions;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSubmit,
  isProcessing,
  downloadOptions,
}) => {
  const [url, setUrl] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<DownloadOptions>(
    normalizeDownloadOptions(downloadOptions.format, downloadOptions.quality),
  );

  useEffect(() => {
    setSelectedOptions(normalizeDownloadOptions(downloadOptions.format, downloadOptions.quality));
  }, [downloadOptions.format, downloadOptions.quality]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isProcessing) {
      onSubmit(url.trim(), selectedOptions);
    }
  };

  const handleFormatChange = (format: DownloadOptions["format"]) => {
    setSelectedOptions((current) => normalizeDownloadOptions(format, current.quality));
  };

  const handleQualityChange = (quality: Mp3Quality) => {
    setSelectedOptions((current) => ({ ...current, quality }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center animate-fade-in py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
          <Music2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Spotify Downloader
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
          Paste any Spotify playlist, album, or track link to download directly as audio files.
        </p>
      </div>

      {/* Main Download Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-[#131518] border border-[#23262c] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50 space-y-5"
      >
        {/* Input + Submit */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            Spotify Link
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Link2 className="w-4 h-4" />
              </div>
              <Input
                type="url"
                placeholder="https://open.spotify.com/playlist/... or /track/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
                className="pl-10 h-12 bg-[#191b20] border-[#2c2f37] text-white text-sm focus-visible:ring-emerald-500"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={!url.trim() || isProcessing}
              className="h-12 px-6 shrink-0 text-sm font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isProcessing ? "Processing..." : "Download"}
            </Button>
          </div>
        </div>

        {/* Options Row */}
        <div className="pt-4 border-t border-[#202329] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Format Selector */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-medium block">Audio Format:</span>
            <div className="flex items-center gap-1.5">
              {FORMAT_PRESETS.map((preset) => {
                const isActive = selectedOptions.format === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleFormatChange(preset.value)}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold"
                        : "bg-[#181a1e] border-[#26282f] text-zinc-400 hover:text-white hover:bg-[#202228]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Selector (if MP3) */}
          {selectedOptions.format === "mp3" ? (
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 font-medium block">Quality:</span>
              <div className="flex items-center gap-1.5">
                {(["320", "128"] as Mp3Quality[]).map((quality) => {
                  const isActive = selectedOptions.quality === quality;
                  return (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => handleQualityChange(quality)}
                      disabled={isProcessing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold"
                          : "bg-[#181a1e] border-[#26282f] text-zinc-400 hover:text-white hover:bg-[#202228]"
                      }`}
                    >
                      {quality === "320" ? "320 kbps (HQ)" : "128 kbps"}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 self-end">
              <span className="text-emerald-400">Lossless</span> studio profile
            </div>
          )}
        </div>
      </form>

      {/* Feature Highlights */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Supports Playlists, Albums &amp; Tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>High Quality Audio (320kbps / Lossless)</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>One-Click ZIP Download</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
