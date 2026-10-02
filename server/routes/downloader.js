import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { Innertube } from 'youtubei.js';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const SpotifyWebApi = require('spotify-web-api-node');
const ytdlp = require('yt-dlp-exec');
const ffmpegPath = require('ffmpeg-static');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup writable download directory
const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR ||
  process.env.MELODIA_DOWNLOAD_DIR ||
  path.join(__dirname, '..', 'downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// In-memory runtime state
const activeProcesses = new Map();
const songCache = new Map(); // spotifyId -> youtubeUrl
const stats = {
  totalSongsDownloaded: 1482,
  totalPlaylistsProcessed: 153,
};

// Spotify API credentials with built-in fallbacks
const SPOTIFY_CLIENT_ID =
  process.env.SPOTIFY_CLIENT_ID || 'b3befe9f06e140b9b1c3a4c6bf14a394';
const SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || 'ace7357de80742cbb9ff4c74af604bf5';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
});

let spotifyTokenExpiresAt = 0;
let youtubeClient = null;

const FORMAT_CONFIG = {
  mp3: {
    extension: 'mp3',
    supportsQuality: true,
    defaultQuality: '320',
  },
  wav: {
    extension: 'wav',
    supportsQuality: false,
    defaultQuality: null,
  },
  flac: {
    extension: 'flac',
    supportsQuality: false,
    defaultQuality: null,
  },
};

// --- HELPER FUNCTIONS ---

function getFfmpegPath() {
  return ffmpegPath;
}

async function getYouTubeClient() {
  if (!youtubeClient) {
    youtubeClient = await Innertube.create();
  }
  return youtubeClient;
}

function normalizeOutputOptions(format, quality) {
  const normalizedFormat = typeof format === 'string' ? format.toLowerCase() : 'mp3';
  const resolvedFormat = FORMAT_CONFIG[normalizedFormat] ? normalizedFormat : 'mp3';
  const resolvedQuality = FORMAT_CONFIG[resolvedFormat].supportsQuality
    ? quality === '128'
      ? '128'
      : FORMAT_CONFIG[resolvedFormat].defaultQuality
    : null;

  return {
    format: resolvedFormat,
    quality: resolvedQuality,
  };
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function removeFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete file ${filePath}:`, err.message);
  }
}

function createBroadcaster(process) {
  return (data) => {
    if (process && process.clients) {
      process.clients.forEach((client) => {
        try {
          client.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch {}
      });
    }
  };
}

function sanitizeTrackFilename(track, index, totalTracks) {
  const orderWidth = String(Math.max(totalTracks, 1)).length;
  const order = String(index + 1).padStart(orderWidth, '0');
  const baseName = `${track.artist} - ${track.name}`
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100) || `track-${index + 1}`;

  return `${order} ${baseName}`;
}

function buildTrackFilePaths(processDir, track, index, totalTracks, format) {
  const baseName = sanitizeTrackFilename(track, index, totalTracks);
  return {
    outputTemplate: path.join(processDir, `${baseName}.%(ext)s`),
    filePath: path.join(processDir, `${baseName}.${FORMAT_CONFIG[format].extension}`),
  };
}

async function resolveVideoUrl(track, youtube) {
  if (songCache.has(track.id)) {
    return songCache.get(track.id);
  }

  const query = `${track.artist} - ${track.name} audio`;
  const search = await youtube.search(query, { type: 'video' });

  if (!search.results || search.results.length === 0) {
    throw new Error('Audio source not found on YouTube');
  }

  const videoId = search.results[0].id;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  songCache.set(track.id, videoUrl);
  return videoUrl;
}

async function downloadTrackForProcess({ process, track, index, totalTracks, processDir, youtube, broadcast }) {
  if (process.cancelled) {
    throw new Error('Download cancelled by user');
  }

  process.currentIndex = index;
  if (process.tracks[index]) {
    process.tracks[index].status = 'Processing';
  }

  broadcast({ type: 'progress', index, status: 'Processing' });
  broadcast({ type: 'log', message: `Downloading [${index + 1}/${totalTracks}]: ${track.name}` });

  const { outputTemplate, filePath } = buildTrackFilePaths(processDir, track, index, totalTracks, process.format);

  try {
    const videoUrl = await resolveVideoUrl(track, youtube);
    removeFileIfExists(filePath);

    const downloadOptions = {
      extractAudio: true,
      audioFormat: process.format,
      output: outputTemplate,
      ffmpegLocation: getFfmpegPath(),
      noPlaylist: true,
    };

    if (process.format === 'mp3' && process.quality) {
      downloadOptions.audioQuality = `${process.quality}K`;
    }

    await ytdlp(videoUrl, downloadOptions);

    if (!fs.existsSync(filePath)) {
      throw new Error('Converted file missing after extraction');
    }

    if (process.tracks[index]) {
      process.tracks[index].status = 'Completed';
    }

    broadcast({ type: 'progress', index, status: 'Completed' });
    return true;
  } catch (err) {
    console.error(`Failed to download ${track.name}:`, err.message);
    removeFileIfExists(filePath);

    if (process.tracks[index]) {
      process.tracks[index].status = 'Failed';
    }

    broadcast({ type: 'progress', index, status: 'Failed', error: err.message });
    return false;
  }
}

async function finalizeProcess({ id, process, processDir, incrementSongs, incrementCollections }) {
  const broadcast = createBroadcaster(process);

  broadcast({ type: 'log', message: 'Packaging audio files into ZIP archive...' });
  const zipPath = path.join(DOWNLOAD_DIR, `${id}.zip`);
  removeFileIfExists(zipPath);
  await zipDirectory(processDir, zipPath);

  stats.totalSongsDownloaded += incrementSongs;
  stats.totalPlaylistsProcessed += incrementCollections;

  process.status = 'complete';
  process.downloadUrl = `/api/downloader/download/${id}`;
  broadcast({
    type: 'complete',
    downloadUrl: process.downloadUrl,
    format: process.format,
    quality: process.quality,
  });
}

async function getSpotifyToken() {
  if (Date.now() < spotifyTokenExpiresAt - 60000) {
    return;
  }

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyTokenExpiresAt = Date.now() + (data.body['expires_in'] || 3600) * 1000;
  } catch (err) {
    console.error('Error retrieving Spotify access token:', err.message);
    throw new Error('Failed to connect to Spotify API. Please check client credentials or connection.');
  }
}

function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', (err) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

function parseSpotifyUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  if (cleanUrl.includes('/playlist/')) {
    const id = cleanUrl.split('/playlist/')[1]?.split('?')[0]?.split('/')[0];
    return id ? { type: 'playlist', id } : null;
  }
  if (cleanUrl.includes('/album/')) {
    const id = cleanUrl.split('/album/')[1]?.split('?')[0]?.split('/')[0];
    return id ? { type: 'album', id } : null;
  }
  if (cleanUrl.includes('/track/')) {
    const id = cleanUrl.split('/track/')[1]?.split('?')[0]?.split('/')[0];
    return id ? { type: 'track', id } : null;
  }

  // Spotify URI format: spotify:track:id, spotify:playlist:id, spotify:album:id
  const uriParts = cleanUrl.split(':');
  if (uriParts.length >= 3 && uriParts[0] === 'spotify') {
    return { type: uriParts[1], id: uriParts[2] };
  }

  return null;
}

async function fetchAllPlaylistTracks(playlistId) {
  let allTracks = [];
  let offset = 0;
  const limit = 50;
  let total;

  do {
    const data = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
    if (!total) total = data.body.total;

    const tracks = data.body.items
      .filter((item) => item && item.track)
      .map((item) => ({
        id: item.track.id || `track_${Math.random()}`,
        name: item.track.name,
        artist: item.track.artists?.[0]?.name || 'Unknown Artist',
        artistId: item.track.artists?.[0]?.id,
      }));

    allTracks = allTracks.concat(tracks);
    offset += limit;
  } while (total > allTracks.length);

  return allTracks;
}

async function fetchAllAlbumTracks(albumId, defaultArtist) {
  let allTracks = [];
  let offset = 0;
  const limit = 50;
  let total;

  do {
    const data = await spotifyApi.getAlbumTracks(albumId, { offset, limit });
    if (!total) total = data.body.total;

    const tracks = data.body.items.map((item) => ({
      id: item.id || `track_${Math.random()}`,
      name: item.name,
      artist: item.artists?.[0]?.name || defaultArtist || 'Unknown Artist',
      artistId: item.artists?.[0]?.id,
    }));

    allTracks = allTracks.concat(tracks);
    offset += limit;
  } while (total > allTracks.length);

  return allTracks;
}

// --- API ROUTES ---

router.get('/stats', (req, res) => {
  res.json({
    totalSongsDownloaded: stats.totalSongsDownloaded,
    totalPlaylistsProcessed: stats.totalPlaylistsProcessed,
    activeProcesses: activeProcesses.size,
  });
});

router.post('/start', async (req, res) => {
  const { playlistUrl, format, quality } = req.body;
  if (!playlistUrl) {
    return res.status(400).json({ message: 'Spotify URL is required.' });
  }

  const outputOptions = normalizeOutputOptions(format, quality);
  const processId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  activeProcesses.set(processId, {
    id: processId,
    clients: [],
    status: 'initializing',
    playlistName: '',
    tracks: [],
    currentIndex: 0,
    downloadUrl: null,
    cancelled: false,
    format: outputOptions.format,
    quality: outputOptions.quality,
  });

  res.json({ processId });

  processMedia(processId, playlistUrl).catch((err) => {
    console.error(`Unhandled error in processMedia for ${processId}:`, err);
  });
});

router.post('/cancel', async (req, res) => {
  const { processId } = req.body;
  const process = activeProcesses.get(processId);

  if (process) {
    process.cancelled = true;
    res.json({ message: 'Cancellation requested' });
  } else {
    res.status(404).json({ message: 'Process not found' });
  }
});

router.post('/cleanup', async (req, res) => {
  const { processId } = req.body;
  const process = activeProcesses.get(processId);

  if (process && process.status === 'processing') {
    return res.status(409).json({ message: 'Cannot cleanup an active process.' });
  }

  removeFileIfExists(path.join(DOWNLOAD_DIR, `${processId}.zip`));
  fs.rm(path.join(DOWNLOAD_DIR, processId), { recursive: true, force: true }, () => {});
  activeProcesses.delete(processId);

  res.json({ message: 'Artifacts removed' });
});

router.post('/retry-failed', async (req, res) => {
  const { processId } = req.body;
  const process = activeProcesses.get(processId);

  if (!process) {
    return res.status(404).json({ message: 'Process not found or expired.' });
  }

  if (process.status === 'processing') {
    return res.status(409).json({ message: 'Process is still running.' });
  }

  const failedIndexes = process.tracks.reduce((indexes, track, index) => {
    if (track.status === 'Failed') {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (failedIndexes.length === 0) {
    return res.status(400).json({ message: 'No failed songs to retry.' });
  }

  process.cancelled = false;
  process.status = 'processing';
  process.downloadUrl = null;

  failedIndexes.forEach((index) => {
    if (process.tracks[index]) {
      process.tracks[index].status = 'Pending';
    }
  });

  res.json({ processId, retriedTracks: failedIndexes.length });

  retryFailedTracks(processId, failedIndexes).catch((err) => {
    console.error(`Unhandled error in retryFailedTracks for ${processId}:`, err);
  });
});

router.get('/stream/:id', (req, res) => {
  const processId = req.params.id;
  const process = activeProcesses.get(processId);
  if (!process) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  process.clients.push(res);

  const syncData = {
    type: 'sync',
    playlistName: process.playlistName,
    tracks: process.tracks,
    currentIndex: process.currentIndex,
    status: process.status,
    downloadUrl: process.downloadUrl,
    format: process.format,
    quality: process.quality,
  };
  res.write(`data: ${JSON.stringify(syncData)}\n\n`);

  req.on('close', () => {
    if (process) {
      process.clients = process.clients.filter((client) => client !== res);
    }
  });
});

router.get('/download/:id', (req, res) => {
  const processId = req.params.id;
  const process = activeProcesses.get(processId);
  const filePath = path.join(DOWNLOAD_DIR, `${processId}.zip`);

  if (fs.existsSync(filePath)) {
    const filename = process?.playlistName
      ? `${process.playlistName.replace(/[<>:"/\\|?*]/g, '_')}.zip`
      : 'melodia-audio.zip';
    res.download(filePath, filename);
  } else {
    res.status(404).send('File not found or expired.');
  }
});

async function processMedia(id, url) {
  const process = activeProcesses.get(id);
  if (!process) return;

  const broadcast = createBroadcaster(process);
  const processDir = path.join(DOWNLOAD_DIR, id);
  ensureDirectory(processDir);

  try {
    broadcast({ type: 'log', message: 'Authenticating with Spotify API...' });
    await getSpotifyToken();

    const parsed = parseSpotifyUrl(url);
    if (!parsed) {
      throw new Error('Invalid Spotify URL. Please provide a valid track, album, or playlist link.');
    }

    let mediaTitle = '';
    let tracks = [];

    if (parsed.type === 'track') {
      broadcast({ type: 'log', message: 'Fetching single track details...' });
      const trackData = await spotifyApi.getTrack(parsed.id);
      const artist = trackData.body.artists?.[0]?.name || 'Unknown Artist';
      mediaTitle = `${artist} - ${trackData.body.name}`;
      tracks = [
        {
          id: trackData.body.id,
          name: trackData.body.name,
          artist: artist,
          artistId: trackData.body.artists?.[0]?.id,
        },
      ];
    } else if (parsed.type === 'album') {
      broadcast({ type: 'log', message: 'Fetching album tracklist...' });
      const albumData = await spotifyApi.getAlbum(parsed.id);
      const artist = albumData.body.artists?.[0]?.name || 'Unknown Artist';
      mediaTitle = `${artist} - ${albumData.body.name}`;
      tracks = await fetchAllAlbumTracks(parsed.id, artist);
    } else if (parsed.type === 'playlist') {
      broadcast({ type: 'log', message: 'Fetching playlist tracklist...' });
      const playlistData = await spotifyApi.getPlaylist(parsed.id);
      mediaTitle = playlistData.body.name || 'Spotify Playlist';
      tracks = await fetchAllPlaylistTracks(parsed.id);
    } else {
      throw new Error(`Unsupported Spotify item type: ${parsed.type}`);
    }

    if (tracks.length === 0) {
      throw new Error('No tracks found in the provided Spotify link.');
    }

    process.playlistName = mediaTitle;
    process.tracks = tracks.map((t) => ({ ...t, status: 'Pending' }));
    process.status = 'processing';

    broadcast({ type: 'playlist-name', name: mediaTitle });
    broadcast({ type: 'tracks', tracks: process.tracks });

    const youtube = await getYouTubeClient();

    let completedDuringRun = 0;

    for (const [index, track] of tracks.entries()) {
      const didComplete = await downloadTrackForProcess({
        process,
        track,
        index,
        totalTracks: tracks.length,
        processDir,
        youtube,
        broadcast,
      });

      if (didComplete) {
        completedDuringRun += 1;
      }
    }

    await finalizeProcess({
      id,
      process,
      processDir,
      incrementSongs: completedDuringRun,
      incrementCollections: 1,
    });
  } catch (err) {
    console.error(err);
    try {
      broadcast({ type: 'error', message: err.message });
    } catch (bcErr) {
      console.error('Broadcast error:', bcErr);
    }

    fs.rm(processDir, { recursive: true, force: true }, () => {});
  }
}

async function retryFailedTracks(id, failedIndexes) {
  const process = activeProcesses.get(id);
  if (!process) {
    throw new Error('Process not found');
  }

  const broadcast = createBroadcaster(process);
  const processDir = path.join(DOWNLOAD_DIR, id);
  ensureDirectory(processDir);

  broadcast({ type: 'tracks', tracks: process.tracks });
  broadcast({ type: 'log', message: `Retrying ${failedIndexes.length} failed track(s)...` });

  try {
    const youtube = await getYouTubeClient();
    let completedDuringRetry = 0;

    for (const index of failedIndexes) {
      const track = process.tracks[index];
      const didComplete = await downloadTrackForProcess({
        process,
        track,
        index,
        totalTracks: process.tracks.length,
        processDir,
        youtube,
        broadcast,
      });

      if (didComplete) {
        completedDuringRetry += 1;
      }
    }

    await finalizeProcess({
      id,
      process,
      processDir,
      incrementSongs: completedDuringRetry,
      incrementCollections: 0,
    });
  } catch (err) {
    console.error(err);
    broadcast({ type: 'error', message: err.message });
  }
}

export default router;