const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('👋 Déconnecter le bot du salon vocal'),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply('❌ Le bot n\'est pas connecté.');

    queue.destroy();
    interaction.client.queues.delete(interaction.guild.id);
    return interaction.reply('👋 Déconnecté du salon vocal.');
  },
};
