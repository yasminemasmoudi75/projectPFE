# 🚀 Guide CRUD Produits / Articles

Ce guide détaille l'utilisation de l'API de gestion des produits (Catalogue Stock) implémentée avec Sequelize et SQL Server.

## 📦 Paramètres Techniques
L'API est mappée sur la table legacy `TabStock` avec les correspondances suivantes :
- `LibArt` ↔ Désignation
- `Description` ↔ `ExLibArt`
- `PrixAchat` ↔ `PrixAvhat`
- `PrixVente` ↔ `PrixVente`
- `Qte` ↔ `Qte`

---

## 🔐 Authentification
Tous les endpoints nécessitent un token JWT valide.
**Header:** `Authorization: Bearer <votre_token>`

---

## ⚙️ API Endpoints

### 1. Créer un Produit
```
POST /api/products
```
**Payload :**
```json
{
  "CodArt": "REF-001",
  "LibArt": "Désignation du produit",
  "Description": "Détails optionnels",
  "PrixVente": 150.500,
  "PrixAchat": 100.000,
  "Qte": 10,
  "Collection": "INFORMATIQUE",
  "Marque": "Dell",
  "Tva": 19
}
```
*Note: Si CodArt n'est pas fourni, le système en génère un automatiquement.*

### 2. Lister les Produits
```
GET /api/products?page=1&limit=50
```
Retourne la liste des produits paginée (exclut l'image BLOB pour performance).

### 3. Détails d'un Produit
```
GET /api/products/:id
```

### 4. Modifier un Produit
```
PUT /api/products/:id
```
Supporte la mise à jour partielle.

### 5. Supprimer un Produit
```
DELETE /api/products/:id
```

---

## 🧪 Tests Automatisés

Un script de test Node.js est disponible pour valider l'implémentation :

```bash
# 1. Obtenir un token
# 2. Configurer TOKEN dans test-product.js
node test-product.js
```

## 📊 Structure de la Réponse Standard
Toutes les réponses suivent ce format "corrigé" :

**Succès :**
```json
{
  "status": "success",
  "message": "Message de confirmation",
  "data": { ... }
}
```

**Erreur :**
```json
{
  "status": "error",
  "message": "Description de l'erreur",
  "error": "Détails techniques optionnels"
}
```
