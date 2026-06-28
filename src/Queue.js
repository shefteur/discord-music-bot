const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
  StreamType,
} = require('@discordjs/voice');
const playdl = require('play-dl');
const { EmbedBuilder } = require('discord.js');

const MAX_QUEUE_SIZE = 500;

class Track {
  constructor({ title, url, duration, thumbnail, requestedBy, platform }) {
    this.title = title;
    this.url = url;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.requestedBy = requestedBy;
    this.platform = platform || 'youtube';
  }
}

class Queue {
  constructor(guildId, voiceChannel, textChannel) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.tracks = [];
    this.currentTrack = null;
    this.loop = false;
    this.loopQueue = false;
    this.paused = false;
    this.connection = null;
    this.player = createAudioPlayer();
    this._autoDisconnectTimer = null;
    this._setupPlayerEvents();
  }

  // ── Connexion au salon vocal ──────────────────────────────────────────────

  async connect() {
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      this.connection.subscribe(this.player);
    } catch {
      this.connection.destroy();
      throw new Error('Impossible de rejoindre le salon vocal (timeout).');
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  // ── Événements du lecteur ────────────────────────────────────────────────

  _setupPlayerEvents() {
    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this._autoDisconnectTimer) {
        clearTimeout(this._autoDisconnectTimer);
        this._autoDisconnectTimer = null;
      }

      if (this.loop && this.currentTrack) {
        return this._play(this.currentTrack);
      }

      if (this.loopQueue && this.currentTrack) {
        this.tracks.push(this.currentTrack);
      }

      this._next();
    });

    this.player.on('error', err => {
      console.error('[Player Error]', err.message);
      this.textChannel.send(`❌ Erreur de lecture pour **${this.currentTrack?.title || 'inconnu'}**. Passage au titre suivant...`);
      this._next();
    });
  }

  // ── Lecture ───────────────────────────────────────────────────────────────

  async _play(track) {
    try {
      let stream;

      if (playdl.yt_validate(track.url) === 'video' || track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
        stream = await playdl.stream(track.url, { quality: 2 });
      } else {
        // URL directe (SoundCloud, etc.)
        stream = await playdl.stream(track.url);
      }

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: false,
      });

      this.player.play(resource);
      this.currentTrack = track;
    } catch (err) {
      console.error('[Play Error]', err.message);
      this.textChannel.send(`❌ Impossible de lire **${track.title}**. Passage au suivant...`);
      this._next();
    }
  }

  _next() {
    if (this.tracks.length === 0) {
      this.currentTrack = null;
      this.textChannel.send('✅ File d\'attente vide ! Déconnexion automatique dans 2 minutes...');
      this._autoDisconnectTimer = setTimeout(() => {
        if (this.player.state.status === AudioPlayerStatus.Idle) {
          this.textChannel.send('👋 Déconnexion automatique (inactivité).');
          this.destroy();
        }
      }, 120_000);
      return;
    }

    const next = this.tracks.shift();
    this._play(next);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎵 Lecture en cours')
      .setDescription(`**[${next.title}](${next.url})**`)
      .addFields(
        { name: '⏱ Durée', value: next.duration, inline: true },
        { name: '📡 Source', value: next.platform, inline: true },
        { name: '👤 Demandé par', value: next.requestedBy, inline: true }
      )
      .setThumbnail(next.thumbnail || null)
      .setFooter({ text: `${this.tracks.length} titre(s) dans la file` });

    this.textChannel.send({ embeds: [embed] });
  }

  // ── API publique ──────────────────────────────────────────────────────────

  get maxSize() { return MAX_QUEUE_SIZE; }

  async addTrack(track) {
    if (this.tracks.length >= MAX_QUEUE_SIZE) {
      throw new Error(`La file d'attente est pleine (max ${MAX_QUEUE_SIZE} titres).`);
    }
    this.tracks.push(track);
    if (this.player.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      this._next();
    }
  }

  async addTracks(tracks) {
    const available = MAX_QUEUE_SIZE - this.tracks.length;
    const toAdd = tracks.slice(0, available);
    this.tracks.push(...toAdd);
    const wasIdle = this.player.state.status === AudioPlayerStatus.Idle && !this.currentTrack;
    if (wasIdle) this._next();
    return { added: toAdd.length, skipped: tracks.length - toAdd.length };
  }

  skip(count = 1) {
    const toSkip = Math.min(count - 1, this.tracks.length);
    this.tracks.splice(0, toSkip);
    this.loop = false;
    this.player.stop();
    return toSkip + 1;
  }

  pause() {
    this.player.pause();
    this.paused = true;
  }

  resume() {
    this.player.unpause();
    this.paused = false;
  }

  stop() {
    this.tracks = [];
    this.loop = false;
    this.loopQueue = false;
    this.currentTrack = null;
    this.player.stop();
  }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  remove(index) {
    if (index < 1 || index > this.tracks.length) return null;
    return this.tracks.splice(index - 1, 1)[0];
  }

  jump(index) {
    if (index < 1 || index > this.tracks.length) return false;
    this.tracks.splice(0, index - 1);
    this.loop = false;
    this.player.stop();
    return true;
  }

  destroy() {
    if (this._autoDisconnectTimer) clearTimeout(this._autoDisconnectTimer);
    this.player.stop();
    if (this.connection) {
      try { this.connection.destroy(); } catch {}
    }
  }
}

module.exports = { Queue, Track };
