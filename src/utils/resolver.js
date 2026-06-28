/**
 * resolver.js
 * Résout n'importe quelle URL ou recherche texte en Track(s).
 * Plateformes supportées :
 *   - YouTube vidéo / playlist
 *   - YouTube Music (même domaine que YT)
 *   - SoundCloud piste / playlist
 *   - Apple Music  → extraction titre+artiste → recherche YouTube
 *   - Deezer       → extraction titre+artiste → recherche YouTube
 *   - URL audio directe (.mp3, .ogg, .wav, .flac, .m4a, .aac)
 *   - Recherche texte libre
 */

const playdl = require('play-dl');
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');
const { Track } = require('../Queue');

const MAX_PLAYLIST = 500;

// ── Helpers ───────────────────────────────────────────────────────────────────

function secToHMS(sec) {
  if (!sec || isNaN(sec)) return '??:??';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function ytVideoToTrack(video, requestedBy) {
  return new Track({
    title: video.title || 'Titre inconnu',
    url: video.url,
    duration: secToHMS(video.durationInSec),
    thumbnail: video.thumbnails?.[0]?.url || null,
    requestedBy,
    platform: 'YouTube',
  });
}

// ── Recherche YouTube fallback ────────────────────────────────────────────────

async function searchYouTube(query, requestedBy) {
  const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
  if (!results.length) throw new Error(`Aucun résultat pour : "${query}"`);
  return [ytVideoToTrack(results[0], requestedBy)];
}

// ── Résolution Apple Music ────────────────────────────────────────────────────

async function resolveAppleMusic(url, requestedBy) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const root = parse(html);

    // Playlist / album
    const isPlaylist = url.includes('/playlist/') || url.includes('/album/');
    if (isPlaylist) {
      const items = root.querySelectorAll('[data-testid="track-title"]');
      const artists = root.querySelectorAll('[data-testid="track-artist"]');
      if (!items.length) throw new Error('Aucun titre trouvé dans la playlist Apple Music.');

      const queries = items.slice(0, MAX_PLAYLIST).map((el, i) => {
        const title = el.text.trim();
        const artist = artists[i]?.text.trim() || '';
        return `${title} ${artist}`;
      });

      const tracks = [];
      for (const q of queries) {
        try {
          const t = await searchYouTube(q, requestedBy);
          tracks.push(...t);
        } catch {}
      }
      return tracks;
    }

    // Titre seul
    const title = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const artist = root.querySelector('meta[name="apple:title"]')?.getAttribute('content') || '';
    return await searchYouTube(`${title} ${artist}`, requestedBy);
  } catch (err) {
    throw new Error(`Erreur Apple Music : ${err.message}`);
  }
}

// ── Résolution Deezer ─────────────────────────────────────────────────────────

async function resolveDeezer(url, requestedBy) {
  try {
    // Deezer a une API publique (sans clé) pour les métadonnées basiques
    const match = url.match(/deezer\.com\/(fr\/|en\/)?(\w+)\/(\d+)/);
    if (!match) throw new Error('URL Deezer invalide.');

    const [, , type, id] = match;

    if (type === 'track') {
      const res = await fetch(`https://api.deezer.com/track/${id}`);
      const data = await res.json();
      return await searchYouTube(`${data.title} ${data.artist.name}`, requestedBy);
    }

    if (type === 'playlist' || type === 'album') {
      const endpoint = type === 'playlist' ? `playlist/${id}/tracks` : `album/${id}/tracks`;
      const res = await fetch(`https://api.deezer.com/${endpoint}?limit=${MAX_PLAYLIST}`);
      const data = await res.json();
      const items = data.data || [];

      const tracks = [];
      for (const item of items) {
        try {
          const t = await searchYouTube(`${item.title} ${item.artist.name}`, requestedBy);
          tracks.push(...t);
        } catch {}
      }
      return tracks;
    }

    throw new Error('Type Deezer non supporté (seuls track, playlist, album le sont).');
  } catch (err) {
    throw new Error(`Erreur Deezer : ${err.message}`);
  }
}

// ── Résolution SoundCloud ─────────────────────────────────────────────────────

async function resolveSoundCloud(url, requestedBy) {
  const info = await playdl.soundcloud(url);
  if (info.type === 'track') {
    return [new Track({
      title: info.name,
      url: info.url,
      duration: secToHMS(info.durationInSec),
      thumbnail: info.thumbnail || null,
      requestedBy,
      platform: 'SoundCloud',
    })];
  }
  if (info.type === 'playlist') {
    const all = await info.all_tracks();
    return all.slice(0, MAX_PLAYLIST).map(t => new Track({
      title: t.name,
      url: t.url,
      duration: secToHMS(t.durationInSec),
      thumbnail: t.thumbnail || null,
      requestedBy,
      platform: 'SoundCloud',
    }));
  }
  throw new Error('Type SoundCloud non reconnu.');
}

// ── Résolution YouTube / YouTube Music ───────────────────────────────────────

async function resolveYouTube(url, requestedBy) {
  const type = playdl.yt_validate(url);

  if (type === 'video') {
    const [info] = await playdl.video_info(url);
    return [ytVideoToTrack(info.video_details, requestedBy)];
  }

  if (type === 'playlist') {
    const playlist = await playdl.playlist_info(url, { incomplete: true });
    const videos = await playlist.all_videos();
    return videos.slice(0, MAX_PLAYLIST).map(v => ytVideoToTrack(v, requestedBy));
  }

  throw new Error('URL YouTube invalide.');
}

// ── URL audio directe ─────────────────────────────────────────────────────────

function resolveDirectAudio(url, requestedBy) {
  const filename = url.split('/').pop().split('?')[0];
  return [new Track({
    title: decodeURIComponent(filename) || 'Fichier audio',
    url,
    duration: '??:??',
    thumbnail: null,
    requestedBy,
    platform: 'URL directe',
  })];
}

// ── Point d'entrée principal ──────────────────────────────────────────────────

/**
 * @param {string} input  URL ou texte de recherche
 * @param {string} requestedBy  Mention/nom de l'utilisateur
 * @returns {Promise<Track[]>}
 */
async function resolve(input, requestedBy) {
  input = input.trim();

  // URL directe audio
  if (/^https?:\/\/.+\.(mp3|ogg|wav|flac|m4a|aac)(\?.*)?$/i.test(input)) {
    return resolveDirectAudio(input, requestedBy);
  }

  // YouTube / YouTube Music
  if (input.includes('youtube.com') || input.includes('youtu.be') || input.includes('music.youtube.com')) {
    return resolveYouTube(input, requestedBy);
  }

  // SoundCloud
  if (input.includes('soundcloud.com')) {
    return resolveSoundCloud(input, requestedBy);
  }

  // Apple Music
  if (input.includes('music.apple.com')) {
    return resolveAppleMusic(input, requestedBy);
  }

  // Deezer
  if (input.includes('deezer.com')) {
    return resolveDeezer(input, requestedBy);
  }

  // Recherche texte libre → YouTube
  return searchYouTube(input, requestedBy);
}

module.exports = { resolve };
