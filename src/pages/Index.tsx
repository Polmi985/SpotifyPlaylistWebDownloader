import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProgressDashboard from "@/components/ProgressDashboard";
import DownloadComplete from "@/components/DownloadComplete";
import type { Track } from "@/components/TrackItem";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_DOWNLOAD_OPTIONS,
  normalizeDownloadOptions,
  type DownloadOptions,
} from "@/lib/download-options";

type AppState = "hero" | "processing" | "complete";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const Index = () => {
  const [appState, setAppState] = useState<AppState>("hero");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlistName, setPlaylistName] = useState("Spotify Audio");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>(DEFAULT_DOWNLOAD_OPTIONS);

  // Connect to backend SSE stream
  const connectToStream = useCallback((processId: string) => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/downloader/stream/${processId}`);

    eventSource.onerror = () => {
      eventSource.close();
      localStorage.removeItem("melodia_process_id");
      setAppState("hero");
    };

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "sync") {
          if (msg.playlistName) setPlaylistName(msg.playlistName);
          if (msg.tracks) setTracks(msg.tracks);
          if (typeof msg.currentIndex === "number") setCurrentIndex(msg.currentIndex);
          if (msg.downloadUrl) setDownloadUrl(msg.downloadUrl);
          setDownloadOptions(normalizeDownloadOptions(msg.format, msg.quality));

          if (msg.status === "complete") {
            setAppState("complete");
            eventSource.close();
          } else {
            setAppState("processing");
          }
        } else if (msg.type === "tracks") {
          setTracks(msg.tracks);
        } else if (msg.type === "playlist-name") {
          setPlaylistName(msg.name);
        } else if (msg.type === "progress") {
          setTracks((prev) =>
            prev.map((t, i) => (i === msg.index ? { ...t, status: msg.status } : t))
          );
          setCurrentIndex(msg.index);
        } else if (msg.type === "complete") {
          setDownloadUrl(msg.downloadUrl);
          setDownloadOptions(normalizeDownloadOptions(msg.format, msg.quality));
          setAppState("complete");
          eventSource.close();
        } else if (msg.type === "error") {
          toast({
            variant: "destructive",
            title: "Download Error",
            description: msg.message || "An error occurred during extraction.",
          });
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };
  }, []);

  // Check for existing session on page load
  useEffect(() => {
    const savedProcessId = localStorage.getItem("melodia_process_id");
    if (savedProcessId) {
      connectToStream(savedProcessId);
    }
  }, [connectToStream]);

  const handleSubmit = async (url: string, options: DownloadOptions) => {
    try {
      setAppState("processing");
      setTracks([]);
      setPlaylistName("Connecting to Spotify...");
      setDownloadOptions(options);

      const res = await fetch(`${API_BASE_URL}/api/downloader/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl: url,
          format: options.format,
          quality: options.quality,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || "Failed to initiate download.");
        } catch {
          throw new Error(`Server Error (${res.status}): ${text.slice(0, 60)}`);
        }
      }

      const data = await res.json();
      localStorage.setItem("melodia_process_id", data.processId);
      connectToStream(data.processId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Could Not Start Download",
        description: message,
      });
      setAppState("hero");
    }
  };

  const handleReset = async () => {
    const processId = localStorage.getItem("melodia_process_id");
    if (processId) {
      try {
        await fetch(`${API_BASE_URL}/api/downloader/cleanup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processId }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    localStorage.removeItem("melodia_process_id");
    setAppState("hero");
    setTracks([]);
    setCurrentIndex(0);
    setDownloadUrl("");
    setDownloadOptions(DEFAULT_DOWNLOAD_OPTIONS);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.location.href = `${API_BASE_URL}${downloadUrl}`;
    }
  };

  const handleCancel = async () => {
    const processId = localStorage.getItem("melodia_process_id");
    if (processId) {
      try {
        await fetch(`${API_BASE_URL}/api/downloader/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processId }),
        });
        toast({ title: "Cancelled", description: "Download was cancelled." });
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("melodia_process_id");
    setAppState("hero");
    setTracks([]);
    setCurrentIndex(0);
    setDownloadUrl("");
    setDownloadOptions(DEFAULT_DOWNLOAD_OPTIONS);
  };

  const handleRetryFailed = async () => {
    const processId = localStorage.getItem("melodia_process_id");
    if (!processId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/downloader/retry-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to retry songs");
      }

      setAppState("processing");
      connectToStream(processId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retry failed tracks.";
      toast({
        variant: "destructive",
        title: "Retry Failed",
        description: message,
      });
      setAppState("complete");
    }
  };

  const completedCount = tracks.filter((track) => track.status === "Completed").length;
  const failedCount = tracks.filter((track) => track.status === "Failed").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d0e] text-zinc-100">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-6 flex-1 flex flex-col items-center justify-center">
        {appState === "hero" && (
          <HeroSection
            onSubmit={handleSubmit}
            isProcessing={false}
            downloadOptions={downloadOptions}
          />
        )}

        {appState === "processing" && (
          <ProgressDashboard
            playlistName={playlistName}
            tracks={tracks}
            currentIndex={currentIndex}
            onReset={handleCancel}
            downloadOptions={downloadOptions}
          />
        )}

        {appState === "complete" && (
          <DownloadComplete
            playlistName={playlistName}
            trackCount={tracks.length}
            onReset={handleReset}
            onDownload={handleDownload}
            onRetryFailed={handleRetryFailed}
            completedCount={completedCount}
            failedCount={failedCount}
            downloadOptions={downloadOptions}
          />
        )}
      </main>

      <footer className="py-4 text-center text-xs text-zinc-600 border-t border-[#1a1c20]">
        Melodia Downloader • Fast &amp; Modern Web App
      </footer>
    </div>
  );
};

export default Index;
