import { describe, it, expect } from "vitest";
import {
  normalizeDownloadOptions,
  getDownloadProfileLabel,
  getDownloadProfileDescription,
} from "@/lib/download-options";

describe("Download Options Utilities", () => {
  it("normalizes default options to MP3 320 kbps", () => {
    const options = normalizeDownloadOptions();
    expect(options).toEqual({
      format: "mp3",
      quality: "320",
    });
  });

  it("handles 128 kbps quality correctly", () => {
    const options = normalizeDownloadOptions("mp3", "128");
    expect(options).toEqual({
      format: "mp3",
      quality: "128",
    });
  });

  it("handles lossless formats without quality", () => {
    const wavOptions = normalizeDownloadOptions("wav");
    expect(wavOptions).toEqual({
      format: "wav",
      quality: null,
    });

    const flacOptions = normalizeDownloadOptions("flac");
    expect(flacOptions).toEqual({
      format: "flac",
      quality: null,
    });
  });

  it("generates correct profile labels", () => {
    expect(getDownloadProfileLabel({ format: "mp3", quality: "320" })).toBe("MP3 320 kbps");
    expect(getDownloadProfileLabel({ format: "mp3", quality: "128" })).toBe("MP3 128 kbps");
    expect(getDownloadProfileLabel({ format: "wav", quality: null })).toBe("WAV");
    expect(getDownloadProfileLabel({ format: "flac", quality: null })).toBe("FLAC");
  });

  it("provides informative descriptions", () => {
    expect(getDownloadProfileDescription({ format: "mp3", quality: "320" })).toContain("highest bitrate");
    expect(getDownloadProfileDescription({ format: "flac", quality: null })).toContain("Lossless");
  });
});
