/**
 * deploy-commands.js
 * Enregistre les slash commands sur Discord.
 * Lance avec : node src/deploy-commands.js
 *
 * - En DEV  : enregistre sur ton serveur (GUILD_ID) → instantané
 * - En PROD : enregistre globalement    → jusqu'à 1h de délai
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`📤 Déploiement de ${commands.length} commande(s)...`);

    // Déploiement serveur (dev) — retire cette ligne en production
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Commandes déployées sur le serveur (GUILD_ID: ${process.env.GUILD_ID})`);
    } else {
      // Déploiement global
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Commandes déployées globalement (jusqu\'à 1h pour apparaître).');
    }
  } catch (err) {
    console.error('❌ Erreur de déploiement :', err);
  }
})();
