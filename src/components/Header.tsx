import React from "react";
import { Music, CheckCircle2 } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-[#202227] bg-[#0e0f12]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">
              Melodia
            </span>
            <span className="text-xs text-zinc-500 ml-1.5 font-normal hidden sm:inline">
              Music Downloader
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#16181c] border border-[#27292e] px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ready</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
