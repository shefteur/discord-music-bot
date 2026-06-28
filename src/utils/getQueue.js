const { Queue } = require('../Queue');

/**
 * Retourne la Queue existante du serveur,
 * ou en crée une nouvelle et la connecte au salon vocal.
 */
async function getOrCreateQueue(client, guild, voiceChannel, textChannel) {
  if (client.queues.has(guild.id)) {
    return client.queues.get(guild.id);
  }

  const queue = new Queue(guild.id, voiceChannel, textChannel);
  await queue.connect();
  client.queues.set(guild.id, queue);

  // Nettoyage automatique quand le bot quitte
  queue.connection.on('stateChange', (_, newState) => {
    if (newState.status === 'destroyed') {
      client.queues.delete(guild.id);
    }
  });

  return queue;
}

module.exports = { getOrCreateQueue };
