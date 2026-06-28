const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('⏩ Sauter directement à un titre dans la file')
    .addIntegerOption(opt =>
      opt.setName('position')
        .setDescription('Position cible dans la file')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue || !queue.tracks.length) return interaction.reply('❌ La file est vide.');

    const pos = interaction.options.getInteger('position');
    const ok = queue.jump(pos);
    if (!ok) return interaction.reply(`❌ Position invalide (max: ${queue.tracks.length}).`);

    return interaction.reply(`⏩ Saut au titre #${pos}.`);
  },
};
