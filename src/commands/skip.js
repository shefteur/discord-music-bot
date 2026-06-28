const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭ Passer au titre suivant')
    .addIntegerOption(opt =>
      opt.setName('nombre')
        .setDescription('Nombre de titres à sauter (défaut: 1)')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue?.currentTrack) return interaction.reply('❌ Rien en cours de lecture.');

    const n = interaction.options.getInteger('nombre') || 1;
    const skipped = queue.skip(n);
    return interaction.reply(`⏭ ${skipped} titre(s) passé(s).`);
  },
};
