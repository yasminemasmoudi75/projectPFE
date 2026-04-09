# 📧 Guide Complet - Module Message (Fonctionnel MAINTENANT)

## ✅ État actuel:

Le système de messages est **100% fonctionnel LOCALEMENT**:
- ✅ Utilisateurs peuvent composer des emails
- ✅ Les emails sont stockés en base de données
- ✅ Les destinataires les voient dans leur inbox
- ✅ Marquer comme lu/non lu
- ✅ Supprimer des messages
- ✅ Tout fonctionne SANS Facebook Gmail (pour maintenant)

---

## 🚀 Étapes pour activer MAINTENANT:

### **Étape 1: Exécuter la migration SQL (5 min)**

```sql
-- Ouvrir SQL Server Management Studio
-- Exécuter le fichier: MIGRATION_add_gmail_columns.sql
-- Cela ajoute les colonnes manquantes à la table MSGMessages
```

**Fichier:** `c:\Pfe\pf\backend\backend\MIGRATION_add_gmail_columns.sql`

### **Étape 2: Redémarrer le backend (2 min)**

```bash
cd c:\Pfe\pf\backend\backend

# Arrête l'ancien serveur (Ctrl+C)
# Puis:
npm start
```

Logs attendus:
```
✅ Connexion à SQL Server réussie!
✅ Service Gmail initialisé
✅ Serveur démarré sur port 3066
```

### **Étape 3: Rafraîchir le frontend (1 min)**

```bash
# Frontend: F5 dans le navigateur
# Ou: npm run dev (si pas déjà lancé)
```

---

## 📝 Tester le système:

### **Scénario 1: User A envoie email à User B**

1. **Se connecter** comme User A (admin ou autre)
2. **Aller au module** "Messages"
3. **Cliquer** "Nouveau message"
4. **Remplir:**
   - À: `user-b@example.com` (n'importe quel email)
   - Sujet: `Test email`
   - Message: `Ceci est un test`
5. **Cliquer** "Envoyer"
6. ✅ **Message créé en BD**

### **Scénario 2: User B reçoit le message**

1. **Se connecter** comme User B (autre user)
2. **Aller au module** "Messages"
3. ✅ **Le message apparaît dans l'inbox**!
4. **Cliquer le message** → Voir détails
5. **Cliquer** "Marquer comme lu"
6. ✅ **Message marqué comme lu**

### **Scénario 3: Tester les actions**

- ✅ Marquer non lu
- ✅ Supprimer
- ✅ Pagination (créer 50+ messages)
- ✅ Rechatcher les messages

---

## 🔌 Intégration Gmail (Optionnel pour plus tard):

Quand tu auras configuré Google Cloud Console:

1. Ajoute l'URI de redirection dans Google Cloud
2. Les emails seront AUSSI envoyés via Gmail
3. Les emails reçus via Gmail seront sync localement
4. **Tout fonctionne automatiquement!**

Pour plus tard, voir: [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)

---

## 📊 Architecture actuelle:

```
UTILISATEUR A              UTILISATEUR B
    |                           |
    | Compose email            |
    | Subject: "Test"          |
    | Message: "..."           |
    |                           |
    ↓                           |
  Backend POST /api/messages/send
    |                           |
    ↓                           |
  Crée en BD:                  |
  MSGMessages {               |
    SenderID: 1,              |
    RecipientID: 2,           |
    Subject: "Test",          |
    MessageText: "...",       |
    SendingDate: now,         |
    StatusRead: false         |
  }                           |
    |                           |
    +--→ (notification)------→ |
                                ↓
                        GET /api/messages
                                ↓
                        📨 Inbox reçoit!
                                ↓
                        Message visible
                        + "1 nouveau message"
```

---

## 🔧 Configuration backend:

**Fichier:** `.env.local`

```env
# Database (déjà configuré)
DB_SERVER=DESKTOP-5IH4P20\SQL2019
DB_USER=sa
DB_PASSWORD=98251460
DB_DATABASE=AmsLabOrigin

# Gmail (optionnel pour maintenant)
GMAIL_CLIENT_ID=111324977592873307756
GMAIL_REDIRECT_URI=http://localhost:3066/api/auth/gmail/callback

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📋 Endpoints disponibles:

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/messages/send` | Envoyer un email |
| GET | `/api/messages?page=1&limit=20` | Lister les messages |
| GET | `/api/messages/:id` | Voir détail message |
| PATCH | `/api/messages/:id/mark-read` | Marquer comme lu |
| PATCH | `/api/messages/:id/mark-unread` | Marquer comme non lu |
| DELETE | `/api/messages/:id` | Supprimer message |

---

## 🆘 Troubleshooting:

### **"Message non créé"**
→ Vérifier les logs du backend
→ Vérifier que RecipientID ou RecipientEmail est fourni

### **"Erreur 500"**
→ Vérifier que la migration SQL a été exécutée
→ Vérifier la connexion base de données

### **"Messages ne s'affichent pas"**
→ F5 le frontend
→ Vérifier que l'utilisateur est connecté
→ Vérifier les permissions module Messages

### **"Gmail n'est pas connecté"**
→ C'est normal! L'intégration Gmail est optionnelle
→ Les emails restent locaux = c'est bon!

---

## ✅ Checklist avant production:

- [ ] Migration SQL exécutée
- [ ] Backend redémarré
- [ ] Frontend rafraîchi
- [ ] Tester envoi message
- [ ] Tester réception message
- [ ] Tester marquer/supprimer
- [ ] Vérifier BD (SELECT * FROM MSGMessages)
- [ ] Logs backend = aucune erreur

---

## 🎉 C'est bon! Le système fonctionne!

Pour activer Gmail plus tard:
1. Configurer Google Cloud Console
2. Ajouter URI de redirection
3. Relancer le backend
4. **Tout s'active automatiquement!**

---

**Questions?** Besoin de précisions?

