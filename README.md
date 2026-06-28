# 🎵 Bot Discord Musique

Bot Discord complet pour jouer de la musique dans un salon vocal.

## Plateformes supportées
| Plateforme | Vidéo | Playlist |
|---|---|---|
| YouTube / YouTube Music | ✅ | ✅ (max 500) |
| SoundCloud | ✅ | ✅ (max 500) |
| Apple Music | ✅ (via YT) | ✅ (via YT) |
| Deezer | ✅ (via YT) | ✅ (via YT) |
| URL audio directe (.mp3, .wav…) | ✅ | — |
| Recherche texte libre | ✅ (via YT) | — |

## Commandes
| Commande | Description |
|---|---|
| `/play <url ou texte>` | Jouer une musique ou playlist |
| `/pause` | Pause / reprendre |
| `/stop` | Arrêter et vider la file |
| `/skip [n]` | Passer n titres |
| `/jump <pos>` | Sauter à une position |
| `/queue [page]` | Voir la file d'attente |
| `/nowplaying` | Titre en cours |
| `/remove <pos>` | Supprimer un titre |
| `/shuffle` | Mélanger la file |
| `/loop off\|track\|queue` | Mode boucle |
| `/disconnect` | Déconnecter le bot |
| `/help` | Aide complète |

---

## 🚀 Installation

### 1. Prérequis
- **Node.js 18+** : https://nodejs.org
- **FFmpeg** : https://ffmpeg.org/download.html  
  *(sur Ubuntu/Debian : `sudo apt install ffmpeg`)*

### 2. Créer le bot Discord
1. Va sur https://discord.com/developers/applications
2. **New Application** → donne un nom
3. Onglet **Bot** → **Add Bot** → copie le **Token**
4. Onglet **OAuth2 > General** → copie le **Client ID**
5. Onglet **Bot** → active les **Privileged Gateway Intents** :
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT

### 3. Inviter le bot sur ton serveur
Génère un lien d'invitation dans **OAuth2 > URL Generator** :
- Scopes : `bot`, `applications.commands`
- Permissions bot : `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Read Message History`

### 4. Configurer le projet
```bash
# Clone / déplace le dossier, puis :
npm install

# Crée ton fichier .env
cp .env.example .env
# Remplis DISCORD_TOKEN, CLIENT_ID, GUILD_ID dans .env
```

### 5. Déployer les commandes
```bash
node src/deploy-commands.js
```

### 6. Lancer le bot
```bash
npm start
# ou en développement (redémarre auto) :
npm run dev
```

---

## ⚠️ Notes importantes

- **Apple Music & Deezer** : le bot extrait le titre/artiste et cherche automatiquement sur YouTube. La lecture reste légale car elle passe par YouTube.
- **File d'attente max** : 500 titres par serveur.
- **Déconnexion auto** : le bot quitte le salon après 2 minutes d'inactivité.
- **Cookies YouTube** (optionnel) : si certaines vidéos sont bloquées (âge, région), renseigne `YT_COOKIE` dans `.env`. Voir : https://github.com/play-dl/play-dl/tree/main/instructions#youtube-cookies
