module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setActivity('🎵 /play pour de la musique', { type: 2 }); // 2 = LISTENING
  },
};
