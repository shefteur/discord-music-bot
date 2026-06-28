const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📋 Affiche la file d\'attente')
    .addIntegerOption(opt =>
      opt.setName('page')
        .setDescription('Numéro de page (10 titres par page)')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue || (!queue.currentTrack && !queue.tracks.length)) {
      return interaction.reply('❌ Aucune musique en cours.');
    }

    const page = (interaction.options.getInteger('page') || 1) - 1;
    const perPage = 10;
    const total = queue.tracks.length;
    const maxPage = Math.max(0, Math.ceil(total / perPage) - 1);
    const clampedPage = Math.min(page, maxPage);
    const slice = queue.tracks.slice(clampedPage * perPage, clampedPage * perPage + perPage);

    const lines = slice.map((t, i) =>
      `\`${clampedPage * perPage + i + 1}.\` [${t.title}](${t.url}) — \`${t.duration}\` — ${t.requestedBy}`
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📋 File d\'attente')
      .setDescription(
        `**En cours :** [${queue.currentTrack?.title || '—'}](${queue.currentTrack?.url || ''}) ${queue.paused ? '⏸' : '▶️'}\n\n` +
        (lines.length ? lines.join('\n') : '*File vide*')
      )
      .setFooter({
        text: `Page ${clampedPage + 1}/${maxPage + 1} • ${total} titre(s) en attente • Boucle: ${queue.loop ? '🔂 piste' : queue.loopQueue ? '🔁 file' : 'off'}`
      });

    return interaction.reply({ embeds: [embed] });
  },
};
