const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('🗑 Supprimer un titre de la file')
    .addIntegerOption(opt =>
      opt.setName('position')
        .setDescription('Position du titre dans la file (voir /queue)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue || !queue.tracks.length) return interaction.reply('❌ La file est vide.');

    const pos = interaction.options.getInteger('position');
    const removed = queue.remove(pos);
    if (!removed) return interaction.reply(`❌ Position invalide. La file contient ${queue.tracks.length} titre(s).`);

    return interaction.reply(`🗑 Supprimé : **${removed.title}**`);
  },
};
