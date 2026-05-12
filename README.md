# ⚡ FlashMeet — Speed Dating Vidéo

Ton app de speed dating vidéo style Omegle, avec WebRTC temps réel.

## Structure du projet

```
speeddate/
├── index.html          ← Le site web complet (front)
├── package.json        ← Dépendances Node.js
├── README.md           ← Ce fichier
└── server/
    └── server.js       ← Serveur signaling WebSocket
```

## Installation & Lancement

### 1. Installe Node.js
Si pas déjà installé : https://nodejs.org (version 18+)

### 2. Installe les dépendances
```bash
cd speeddate
npm install
```

### 3. Lance le serveur
```bash
npm start
```

Tu devrais voir :
```
🚀 SpeedDate → http://localhost:3000
```

### 4. Ouvre le site
Ouvre **http://localhost:3000** dans ton navigateur.

Pour tester avec 2 personnes :
- Ouvre **2 onglets** (ou 2 navigateurs différents)
- Clique "Commencer" dans les deux
- Les deux se connectent automatiquement !

---

## Comment ça marche

```
Personne A                 Serveur Node.js            Personne B
    |                           |                          |
    |-- find_match ------------>|                          |
    |                           |<--------- find_match ----|
    |<-- matched (initiator) ---|--- matched (receiver) -->|
    |                           |                          |
    |-- offer (WebRTC) -------->|-- offer (WebRTC) ------->|
    |<-- answer (WebRTC) -------|<-- answer (WebRTC) ------|
    |<-- ice_candidate ---------|<-- ice_candidate --------|
    |                           |                          |
    |<====== VIDÉO DIRECT P2P (WebRTC) ==================>|
    |                           |                          |
    |-- like ------------------>|-- partner_liked -------->|
    |<-- partner_liked ---------|<-- like -----------------|
    |<-- match! ----------------|------------ match! ----->|
```

## Fonctionnalités

| Bouton | Action |
|--------|--------|
| ⚡ Next | Passe à la personne suivante |
| ✕ Pass | Refuse et cherche quelqu'un d'autre |
| ❤️ Like | Like la personne |
| 🎤 Mute | Coupe ton micro |
| 📷 Cam | Coupe ta caméra |

- **Match mutuel** : si les deux likent → overlay Match + Chat ouvert
- **Timer 3 minutes** : compte à rebours visible, rouge sous 30 secondes
- **Chat privé** : uniquement si match mutuel

## Pour mettre en ligne (production)

1. **Hébergement** : Railway, Render, ou VPS (DigitalOcean)
2. **HTTPS obligatoire** pour que la caméra fonctionne en prod
3. **Serveur TURN** : pour les utilisateurs derrière firewall strict, remplace les credentials dans `index.html` par les tiens (Metered.ca, Twilio, etc.)

## Coût serveur TURN (pour prod)
- **Metered.ca** : gratuit jusqu'à 50GB/mois (~100 users)
- **Twilio** : $0.0015/min par participant
- **Ton propre TURN** : coturn sur VPS (~5€/mois DigitalOcean)
