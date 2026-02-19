# 🚀 Guide CRUD Projets

## 📦 Prérequis

- ✅ Node.js installé
- ✅ Serveur backend démarré (`npm start` dans `/back`)
- ✅ Base de données SQL Server connectée
- ✅ Postman ou cURL installé

---

## 🏃 Démarrage Rapide

### Étape 1️⃣: Serveur Backend

```bash
cd back
npm install
npm start
```

**Résultat attendu:**
```
🚀 Serveur démarré sur le port 3000
📍 Environnement: development
🔗 URL: http://localhost:3000
```

### Étape 2️⃣: Vérifier la connexion

```bash
curl http://localhost:3000/health
```

**Réponse:**
```json
{
  "status": "OK",
  "message": "Le serveur fonctionne correctement",
  "timestamp": "2026-02-15T10:30:45.123Z"
}
```

---

## 🔐 Authentification

### 1. Se Connecter

**Méthode 1: Postman**
- Créer une requête `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
```json
{
  "email": "votre_email@example.com",
  "password": "votre_mot_passe"
}
```

**Méthode 2: cURL**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Copier le Token

Dans la réponse, trouvez le champ `token`:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 3. Utiliser le Token

**Dans Postman:**
- Onglet "Headers"
- Ajouter: `Authorization: Bearer {votre_token}`

**Avec cURL:**
```bash
curl -H "Authorization: Bearer {votre_token}" \
  http://localhost:3000/api/projets
```

---

## 🧪 Tests Postman

### Option 1: Importer la Collection

1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner le fichier `postman_collection.json`
4. La collection s'ajoute automatiquement

### Option 2: Tests Manuels

Sinon, suivez le document `POSTMAN_TEST_PROJETS.md`

---

## ⚙️ API Endpoints

### CREATE - Ajouter un projet
```
POST /api/projets
```

**Body obligatoire:**
- `Nom_Projet` (string): Nom du projet

**Body optionnel:**
- `Code_Pro`: Code unique
- `IDTiers`: UUID du client
- `CA_Estime`: Chiffre d'affaires estimé
- `Budget_Alloue`: Budget alloué
- `Avancement`: 0-100
- `Phase`: Phase actuelle
- `Priorite`: Niveau de priorité
- `Date_Echeance`: Date limite
- `Date_Cloture_Reelle`: Date de fermeture
- `Note_Privee`: Notes internes
- `Alerte_IA_Risque`: Boolean

**Exemple:**
```json
{
  "Code_Pro": "PROJ-2026-001",
  "Nom_Projet": "Refonte Site Web",
  "IDTiers": "550e8400-e29b-41d4-a716-446655440000",
  "CA_Estime": 50000,
  "Budget_Alloue": 40000,
  "Avancement": 25,
  "Phase": "Développement",
  "Priorite": "Haute",
  "Date_Echeance": "2026-06-30",
  "Note_Privee": "Client prioritaire"
}
```

---

### READ - Lister les projets
```
GET /api/projets
```

**Paramètres (optionnels):**
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 10)
- `phase`: Filtrer par phase
- `priority`: Filtrer par priorité
- `tierId`: Filtrer par client

**Exemple:**
```
GET /api/projets?page=1&limit=5&phase=Développement&priority=Haute
```

**Réponse:**
```json
{
  "status": "success",
  "count": 5,
  "total": 23,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

### READ BY ID - Détails d'un projet
```
GET /api/projets/:id
```

**Exemple:**
```
GET /api/projets/1
```

---

### UPDATE - Modifier un projet
```
PUT /api/projets/:id
```

**Exemple:**
```
PUT /api/projets/1
```

**Body:**
```json
{
  "Avancement": 60,
  "Phase": "Test",
  "Alerte_IA_Risque": true,
  "Note_Privee": "Tests en cours"
}
```

---

### DELETE - Supprimer un projet
```
DELETE /api/projets/:id
```

⚠️ **Nécessite le rôle Admin!**

**Exemple:**
```
DELETE /api/projets/1
```

---

## 🧬 Exécution du Script de Test

### Préparer le Script

```bash
# 1. Éditer le fichier test-projet.js
# 2. Remplacer TOKEN par votre token JWT
# 3. Remplacer TIERS_ID par un ID de client existant
```

### Lancer les Tests

```bash
node test-projet.js
```

**Résultat:**
```
==================================================
🧪 TESTS CRUD PROJETS
==================================================

📝 TEST 1: Créer un nouveau projet
==================================================
✅ Succès!
ID du projet: 42

📋 TEST 2: Récupérer tous les projets
==================================================
✅ Succès!
Total projets: 5
Projets retournés: 5
Pages: 1/1

...
```

---

## 🐛 Dépannage

### ❌ Token invalide
```json
{
  "status": "error",
  "message": "Token manquant ou invalide"
}
```
**Solution:** Reconnectez-vous avec `/api/auth/login`

---

### ❌ Projet non trouvé
```json
{
  "status": "error",
  "message": "Projet non trouvé"
}
```
**Solution:** Vérifiez l'ID du projet

---

### ❌ Le nom du projet est obligatoire
```json
{
  "status": "error",
  "message": "Le nom du projet est obligatoire"
}
```
**Solution:** Incluez le champ `Nom_Projet`

---

### ❌ L'avancement doit être entre 0 et 100
```json
{
  "status": "error",
  "message": "L'avancement doit être entre 0 et 100"
}
```
**Solution:** `Avancement` doit être dans la plage 0-100

---

### ❌ Accès refusé (DELETE)
```json
{
  "status": "error",
  "message": "Accès refusé"
}
```
**Solution:** Seuls les Admin peuvent supprimer. Utilisez un compte Admin.

---

### ❌ La date de clôture ne peut pas être après la date d'échéance
```json
{
  "status": "error",
  "message": "La date de clôture ne peut pas être après la date d'échéance"
}
```
**Solution:** Vérifiez que `Date_Cloture_Reelle <= Date_Echeance`

---

## 📊 Validation des Données

| Champ | Validation |
|-------|-----------|
| **Nom_Projet** | Non vide, obligatoire |
| **Avancement** | 0-100 |
| **Date_Echeance** vs **Date_Cloture_Reelle** | Clôture ≤ Échéance |
| **IDTiers** | Doit exister en BD (si fourni) |

---

## 💡 Conseils d'Usage

1. **Créer d'abord un client (Tiers)** avant de créer un projet
2. **Utiliser des dates ISO** (YYYY-MM-DD)
3. **Tester d'abord avec Postman** avant d'intégrer au frontend
4. **Token JWT expire**: Reconnectez-vous régulièrement
5. **Pagination**: Utilisez `page` et `limit` pour les listes longues

---

## 📝 Structure de la Réponse

### Succès (201/200)
```json
{
  "status": "success",
  "message": "...",
  "data": { /* objet projet */ }
}
```

### Erreur (400/404/500)
```json
{
  "status": "error",
  "message": "Description de l'erreur"
}
```

---

## 🔗 Ressources

- [Documentation Postman](https://learning.postman.com)
- [API REST Concepts](https://restfulapi.net)
- [Sequelize ORM](https://sequelize.org)
- [JWT (JSON Web Tokens)](https://jwt.io)

---

## 📞 Support

Pour des questions ou bugs:
1. Vérifiez les logs du serveur
2. Testez avec cURL pour éliminer les variables Postman
3. Vérifiez la connexion BD
4. Consultez `POSTMAN_TEST_PROJETS.md`

