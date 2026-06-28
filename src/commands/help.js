const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Affiche toutes les commandes du bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎵 Bot Musique — Aide')
      .setDescription('Toutes les commandes disponibles :')
      .addFields(
        {
          name: '▶️ Lecture',
          value: [
            '`/play <url ou recherche>` — Jouer une musique ou playlist',
            '`/pause` — Mettre en pause / reprendre',
            '`/stop` — Arrêter et vider la file',
            '`/disconnect` — Déconnecter le bot',
          ].join('\n'),
        },
        {
          name: '📋 File d\'attente',
          value: [
            '`/queue [page]` — Voir la file d\'attente',
            '`/nowplaying` — Titre en cours',
            '`/skip [n]` — Passer n titres',
            '`/jump <position>` — Sauter à une position',
            '`/remove <position>` — Retirer un titre',
            '`/shuffle` — Mélanger la file',
          ].join('\n'),
        },
        {
          name: '🔁 Boucle',
          value: '`/loop off|track|queue` — Mode boucle',
        },
        {
          name: '📡 Plateformes supportées',
          value: [
            '• **YouTube** & **YouTube Music** (vidéo, playlist)',
            '• **SoundCloud** (piste, playlist)',
            '• **Apple Music** (titre, album, playlist) → lu via YouTube',
            '• **Deezer** (titre, album, playlist) → lu via YouTube',
            '• **URL audio directe** (.mp3, .wav, .flac, .m4a…)',
            '• **Recherche texte libre** → YouTube',
          ].join('\n'),
        },
        {
          name: '⚙️ Infos',
          value: 'File d\'attente max : **500 titres** • Déconnexion auto après **2 min** d\'inactivité',
        }
      )
      .setFooter({ text: 'Bot Musique v2.0' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
