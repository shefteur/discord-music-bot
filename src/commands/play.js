const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resolve } = require('../utils/resolver');
const { getOrCreateQueue } = require('../utils/getQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Jouer une musique ou playlist')
    .addStringOption(opt =>
      opt.setName('input')
        .setDescription('URL ou nom de la musique à rechercher')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply('❌ Tu dois être dans un salon vocal !');
    }

    const perms = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!perms.has('Connect') || !perms.has('Speak')) {
      return interaction.editReply('❌ Je n\'ai pas la permission de rejoindre / parler dans ce salon.');
    }

    const input = interaction.options.getString('input');

    try {
      await interaction.editReply(`🔍 Recherche en cours pour : \`${input}\`...`);

      const tracks = await resolve(input, `<@${interaction.user.id}>`);

      if (!tracks.length) {
        return interaction.editReply('❌ Aucun résultat trouvé.');
      }

      const queue = await getOrCreateQueue(
        interaction.client,
        interaction.guild,
        voiceChannel,
        interaction.channel
      );

      const { added, skipped } = await queue.addTracks(tracks);

      if (tracks.length === 1) {
        const t = tracks[0];
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('✅ Ajouté à la file')
          .setDescription(`**[${t.title}](${t.url})**`)
          .addFields(
            { name: '⏱ Durée', value: t.duration, inline: true },
            { name: '📡 Source', value: t.platform, inline: true },
            { name: '📋 Position', value: queue.currentTrack ? `#${queue.tracks.length}` : 'Prochain', inline: true }
          )
          .setThumbnail(t.thumbnail || null);
        return interaction.editReply({ content: '', embeds: [embed] });
      }

      // Playlist
      let msg = `✅ **${added} titre(s)** ajouté(s) à la file depuis \`${input}\`.`;
      if (skipped > 0) msg += `\n⚠️ ${skipped} titre(s) ignoré(s) (file pleine, max 500).`;
      return interaction.editReply(msg);

    } catch (err) {
      console.error('[/play]', err);
      return interaction.editReply(`❌ Erreur : ${err.message}`);
    }
  },
};
