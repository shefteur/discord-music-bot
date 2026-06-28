const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸ Mettre en pause / reprendre la lecture'),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue?.currentTrack) return interaction.reply('❌ Rien en cours de lecture.');

    if (queue.paused) {
      queue.resume();
      return interaction.reply('▶️ Lecture reprise.');
    } else {
      queue.pause();
      return interaction.reply('⏸ Lecture mise en pause.');
    }
  },
};
