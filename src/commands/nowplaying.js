const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('🎶 Affiche le titre en cours de lecture'),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue?.currentTrack) return interaction.reply('❌ Rien en cours de lecture.');

    const t = queue.currentTrack;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎶 En cours de lecture')
      .setDescription(`**[${t.title}](${t.url})**`)
      .addFields(
        { name: '⏱ Durée', value: t.duration, inline: true },
        { name: '📡 Source', value: t.platform, inline: true },
        { name: '👤 Demandé par', value: t.requestedBy, inline: true },
        { name: 'État', value: queue.paused ? '⏸ Pause' : '▶️ Lecture', inline: true },
        { name: 'Boucle', value: queue.loop ? '🔂 Piste' : queue.loopQueue ? '🔁 File' : '❌ Off', inline: true },
        { name: 'File', value: `${queue.tracks.length} titre(s)`, inline: true }
      )
      .setThumbnail(t.thumbnail || null);

    return interaction.reply({ embeds: [embed] });
  },
};
