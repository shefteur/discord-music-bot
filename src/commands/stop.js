const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹ Arrêter la lecture et vider la file'),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply('❌ Aucune musique en cours.');

    queue.stop();
    return interaction.reply('⏹ Lecture arrêtée et file vidée.');
  },
};
