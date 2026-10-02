export type DownloadFormat = "mp3" | "wav" | "flac";
export type Mp3Quality = "128" | "320";

export interface DownloadOptions {
  format: DownloadFormat;
  quality: Mp3Quality | null;
}

export const DEFAULT_DOWNLOAD_OPTIONS: DownloadOptions = {
  format: "mp3",
  quality: "320",
};

export const FORMAT_PRESETS: Array<{
  value: DownloadFormat;
  label: string;
  accent: string;
  description: string;
  supportsQuality: boolean;
}> = [
  {
    value: "mp3",
    label: "MP3",
    accent: "128 / 320 kbps",
    description: "Fast export for phones, cars, and everyday listening.",
    supportsQuality: true,
  },
  {
    value: "wav",
    label: "WAV",
    accent: "Uncompressed",
    description: "Studio-friendly output when size is less important than fidelity.",
    supportsQuality: false,
  },
  {
    value: "flac",
    label: "FLAC",
    accent: "Lossless",
    description: "Archive-grade audio with smaller files than WAV.",
    supportsQuality: false,
  },
];

export function normalizeDownloadOptions(format?: string | null, quality?: string | null): DownloadOptions {
  const normalizedFormat = format === "wav" || format === "flac" ? format : "mp3";

  if (normalizedFormat !== "mp3") {
    return {
      format: normalizedFormat,
      quality: null,
    };
  }

  return {
    format: "mp3",
    quality: quality === "128" ? "128" : "320",
  };
}

export function getDownloadProfileLabel(options: DownloadOptions): string {
  if (options.format === "mp3") {
    return `MP3 ${options.quality ?? "320"} kbps`;
  }

  return options.format.toUpperCase();
}

export function getDownloadProfileDescription(options: DownloadOptions): string {
  if (options.format === "mp3") {
    return options.quality === "128"
      ? "Compact export tuned for smaller ZIP files."
      : "Premium MP3 export with the highest bitrate option.";
  }

  if (options.format === "wav") {
    return "Uncompressed output with maximum compatibility.";
  }

  return "Lossless compression for a premium archive-ready pack.";
}