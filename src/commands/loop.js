const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('🔁 Changer le mode de boucle')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Mode de boucle')
        .setRequired(true)
        .addChoices(
          { name: '❌ Off', value: 'off' },
          { name: '🔂 Piste actuelle', value: 'track' },
          { name: '🔁 Toute la file', value: 'queue' }
        )
    ),

  async execute(interaction) {
    const queue = interaction.client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply('❌ Aucune musique en cours.');

    const mode = interaction.options.getString('mode');
    queue.loop = mode === 'track';
    queue.loopQueue = mode === 'queue';

    const labels = { off: '❌ Boucle désactivée', track: '🔂 Boucle sur la piste', queue: '🔁 Boucle sur la file' };
    return interaction.reply(labels[mode]);
  },
};
