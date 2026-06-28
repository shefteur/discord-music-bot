const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Mélanger aléatoirement la file d\'attente'),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue || queue.tracks.length < 2) return interaction.reply('❌ Pas assez de titres dans la file.');

    queue.shuffle();
    return interaction.reply(`🔀 File mélangée (${queue.tracks.length} titres).`);
  },
};
