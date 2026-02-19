# 📋 Test CRUD Projets avec Postman

## 🔐 Authentification
Avant de faire les tests, vous devez obtenir un token JWT:

### 1️⃣ Se connecter
**POST** `http://localhost:3000/api/auth/login`

```json
{
  "email": "votre_email@example.com",
  "password": "votre_mot_passe"
}
```

**Réponse (sauvegardez le token):**
```json
{
  "status": "success",
  "token": "eyJhbGc...",
  "user": {...}
}
```

Après connexion, copiez le **token** et ajoutez-le en **Bearer Token** dans Postman:
- Onglet "Authorization"
- Type: "Bearer Token"
- Token: Collez le token obtenu

---

## 📌 Endpoints PROJETS

### 1️⃣ CREATE - Créer un nouveau projet
**POST** `http://localhost:3000/api/projets`

**Headers:**
```
Authorization: Bearer {votre_token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "Code_Pro": "PROJ-001",
  "Nom_Projet": "Développement Application Mobile",
  "IDTiers": "550e8400-e29b-41d4-a716-446655440000",
  "CA_Estime": 50000,
  "Budget_Alloue": 40000,
  "Avancement": 30,
  "Phase": "En cours",
  "Priorite": "Haute",
  "Date_Echeance": "2026-06-30",
  "Note_Privee": "Client demande une interface moderne"
}
```

**Réponse (201 Created):**
```json
{
  "status": "success",
  "message": "Projet créé avec succès",
  "data": {
    "ID_Projet": 1,
    "Code_Pro": "PROJ-001",
    "Nom_Projet": "Développement Application Mobile",
    ...
  }
}
```

---

### 2️⃣ READ - Récupérer tous les projets
**GET** `http://localhost:3000/api/projets`

**Headers:**
```
Authorization: Bearer {votre_token}
```

**Query Parameters (optionnels):**
- `tierId`: Filtrer par ID Tiers
- `phase`: Filtrer par phase (ex: "En cours")
- `priority`: Filtrer par priorité (ex: "Haute")

**Exemple avec filtres:**
```
GET http://localhost:3000/api/projets?phase=En%20cours&priority=Haute
```

**Réponse (200 OK):**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "ID_Projet": 1,
      "Code_Pro": "PROJ-001",
      "Nom_Projet": "Développement Application Mobile",
      "client": {
        "IDTiers": "550e8400-e29b-41d4-a716-446655440000",
        "Raisoc": "Nom de l'entreprise cliente"
      }
      ...
    }
  ]
}
```

---

### 3️⃣ READ - Récupérer un projet par ID
**GET** `http://localhost:3000/api/projets/:id`

**Exemple:**
```
GET http://localhost:3000/api/projets/1
```

**Headers:**
```
Authorization: Bearer {votre_token}
```

**Réponse (200 OK):**
```json
{
  "status": "success",
  "data": {
    "ID_Projet": 1,
    "Code_Pro": "PROJ-001",
    "Nom_Projet": "Développement Application Mobile",
    "IDTiers": "550e8400-e29b-41d4-a716-446655440000",
    "CA_Estime": 50000,
    "Budget_Alloue": 40000,
    "Avancement": 30,
    "Phase": "En cours",
    "Priorite": "Haute",
    "Date_Echeance": "2026-06-30",
    "Date_Creation": "2026-02-15T10:00:00.000Z",
    "Date_Cloture_Reelle": null,
    "Note_Privee": "Client demande une interface moderne",
    "Alerte_IA_Risque": false,
    "client": {
      "IDTiers": "550e8400-e29b-41d4-a716-446655440000",
      "Raisoc": "Nom de l'entreprise"
    }
  }
}
```

---

### 4️⃣ UPDATE - Mettre à jour un projet
**PUT** `http://localhost:3000/api/projets/:id`

**Exemple:**
```
PUT http://localhost:3000/api/projets/1
```

**Headers:**
```
Authorization: Bearer {votre_token}
Content-Type: application/json
```

**Body (JSON) - Mettez à jour les champs souhaités:**
```json
{
  "Nom_Projet": "Développement Application Mobile - V2",
  "Avancement": 60,
  "Phase": "Test",
  "Priorite": "Très haute",
  "Alerte_IA_Risque": true,
  "Note_Privee": "Retards identifiés - prévoir réunion"
}
```

**Réponse (200 OK):**
```json
{
  "status": "success",
  "message": "Projet mis à jour avec succès",
  "data": {
    "ID_Projet": 1,
    "Nom_Projet": "Développement Application Mobile - V2",
    "Avancement": 60,
    ...
  }
}
```

---

### 5️⃣ DELETE - Supprimer un projet
**DELETE** `http://localhost:3000/api/projets/:id`

**Exemple:**
```
DELETE http://localhost:3000/api/projets/1
```

**Headers:**
```
Authorization: Bearer {votre_token}
```

**Note:** Seuls les **Admin** peuvent supprimer des projets.

**Réponse (200 OK):**
```json
{
  "status": "success",
  "message": "Projet supprimé avec succès"
}
```

---

## ⚠️ Codes d'erreur possibles

| Code | Message | Cause |
|------|---------|-------|
| **400** | Le nom du projet est obligatoire | Champ `Nom_Projet` absent |
| **401** | Token manquant ou invalide | Pas de token ou token expiré |
| **403** | Accès refusé | Pas les droits Admin pour DELETE |
| **404** | Projet non trouvé | ID de projet inexistant |
| **500** | Erreur serveur | Problème BD |

---

## 📊 Champs de la table TabProjet

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|------------|
| ID_Projet | INTEGER | Identifiant unique | ✅ (Auto) |
| Code_Pro | STRING | Code projet | ❌ |
| Nom_Projet | STRING | Nom du projet | ✅ |
| IDTiers | UUID | Référence client | ❌ |
| CA_Estime | FLOAT | Chiffre d'affaires estimé | ❌ |
| Budget_Alloue | FLOAT | Budget alloué | ❌ |
| Avancement | INTEGER | Pourcentage (0-100) | ❌ |
| Phase | STRING | Phase du projet | ❌ |
| Priorite | STRING | Niveau de priorité | ❌ |
| Date_Echeance | DATE | Date limite | ❌ |
| Date_Creation | DATE | Date de création | ✅ (Auto) |
| Date_Cloture_Reelle | DATE | Date de clôture | ❌ |
| Note_Privee | TEXT | Notes internes | ❌ |
| Alerte_IA_Risque | BOOLEAN | Alerte IA - Risque | ❌ |

---

## 💡 Conseils

1. **Avant de créer:** Vérifiez l'ID d'un client (Tiers) existant
2. **Avancement:** Ne peut être que entre 0 et 100
3. **Dates:** Format ISO 8601 (YYYY-MM-DD)
4. **GET avec filtres:** Les paramètres sont optionnels
5. **Token expiré:** Reconnectez-vous via `/api/auth/login`

