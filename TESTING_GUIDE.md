# 🧪 GUIDE DE TEST - TabRoleFilterVisibility

## 📊 FICHIERS CRÉÉS

1. **filterService.js** - Service générique pour interroger la table
2. **testFilterController.js** - Contrôleur avec 8 endpoints de test
3. **testFilterRoutes.js** - Routes pour tous les tests

---

## 🔌 ÉTAPE 1: Intégrer les routes dans app.js

Ouvrir: `backend/backend/src/app.js`

Ajouter cette ligne avec les autres imports de routes:

```javascript
const testFilterRoutes = require('./routes/testFilterRoutes');
```

Puis, ajouter les routes (avant les error handlers):

```javascript
// Test Routes
app.use('/api', testFilterRoutes);
```

**Exemple complet:**
```javascript
// ============================================================================
// ROUTES
// ============================================================================

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const reclamationRoutes = require('./routes/reclamations');
const testFilterRoutes = require('./routes/testFilterRoutes');  // ← AJOUTER

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reclamations', reclamationRoutes);
app.use('/api', testFilterRoutes);  // ← AJOUTER

// ... rest of app.js
```

---

## 🚀 ÉTAPE 2: Démarrer le backend

```bash
cd d:\pfe\pfe\backend\backend
npm start
```

**Résultat attendu:**
```
✅ Server running on port 3066
✅ filterService loaded
```

---

## 📋 ÉTAPE 3: TESTER LES ENDPOINTS

### TEST 1️⃣: Vérifier la connexion à la table

```
GET http://localhost:3066/api/test/connection
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "Table connection OK",
  "data": {
    "tableExists": true,
    "totalRows": 59
  }
}
```

---

### TEST 2️⃣: Obtenir TOUS les filtres (visible + caché) pour client/STOCK

```
GET http://localhost:3066/api/test/filters/client/STOCK
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "Filters for client/STOCK",
  "data": {
    "role": "client",
    "module": "STOCK",
    "totalFilters": 4,
    "filters": [
      {
        "key": "all",
        "label": "Tous",
        "visible": true,
        "valueType": "enum"
      },
      {
        "key": "low",
        "label": "Faible",
        "visible": false,     ← CACHÉ pour client!
        "valueType": "enum"
      },
      ...
    ]
  }
}
```

---

### TEST 3️⃣: Obtenir SEULEMENT les filtres VISIBLES pour client/STOCK

```
GET http://localhost:3066/api/test/visible-filters/client/STOCK
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "Visible filters for client/STOCK",
  "data": {
    "role": "client",
    "module": "STOCK",
    "visibleCount": 3,      ← Seulement les visibles
    "filters": [
      { "key": "all", "label": "Tous", "visible": true },
      { "key": "ok", "label": "Dispo", "visible": true },
      { "key": "rupture", "label": "Rupture", "visible": true }
    ]
  }
}
```

---

### TEST 4️⃣: Obtenir tous les RÔLES

```
GET http://localhost:3066/api/test/roles
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "All available roles",
  "data": {
    "totalRoles": 5,
    "roles": [
      "admin",
      "agent",
      "client",
      "commercial",
      "technicien"
    ]
  }
}
```

---

### TEST 5️⃣: Obtenir tous les MODULES

```
GET http://localhost:3066/api/test/modules
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "All available modules",
  "data": {
    "totalModules": 6,
    "modules": [
      "BCV",
      "BLV",
      "DEVIS",
      "FAV",
      "RECLAMATION",
      "STOCK"
    ]
  }
}
```

---

### TEST 6️⃣: Statistiques GLOBALES de la table

```
GET http://localhost:3066/api/test/stats
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "Table statistics",
  "data": {
    "TotalRows": 59,
    "TotalRoles": 5,
    "TotalModules": 6,
    "TotalFilters": 23,
    "VisibleCount": 54,
    "HiddenCount": 5
  }
}
```

---

### TEST 7️⃣: Tous les filtres d'un MODULE (tous les rôles)

```
GET http://localhost:3066/api/test/module/STOCK
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "All filters for module STOCK",
  "data": {
    "module": "STOCK",
    "totalFilters": 20,
    "byRole": {
      "admin": [
        { "key": "all", "label": "Tous", "visible": true },
        { "key": "ok", "label": "Dispo", "visible": true },
        { "key": "low", "label": "Faible", "visible": true },
        { "key": "rupture", "label": "Rupture", "visible": true }
      ],
      "client": [
        { "key": "all", "label": "Tous", "visible": true },
        { "key": "ok", "label": "Dispo", "visible": true },
        { "key": "low", "label": "Faible", "visible": false },  ← hidden
        { "key": "rupture", "label": "Rupture", "visible": true }
      ],
      ...
    }
  }
}
```

---

### TEST 8️⃣: DASHBOARD COMPLET (matrice de tous les filtres)

```
GET http://localhost:3066/api/test/dashboard
```

**Résultat attendu:**
```json
{
  "status": "success",
  "message": "Complete test dashboard",
  "data": {
    "stats": {
      "TotalRows": 59,
      "TotalRoles": 5,
      "TotalModules": 6,
      "TotalFilters": 23,
      "VisibleCount": 54,
      "HiddenCount": 5
    },
    "roles": ["admin", "agent", "client", "commercial", "technicien"],
    "modules": ["BCV", "BLV", "DEVIS", "FAV", "RECLAMATION", "STOCK"],
    "filterMatrix": {
      "admin/STOCK": {
        "role": "admin",
        "module": "STOCK",
        "visibleCount": 4,
        "filters": ["all", "ok", "low", "rupture"]
      },
      "client/STOCK": {
        "role": "client",
        "module": "STOCK",
        "visibleCount": 3,
        "filters": ["all", "ok", "rupture"]
      },
      ...
    }
  }
}
```

---

## 🧪 TESTER AVEC POSTMAN

Créer une collection Postman avec ces requêtes:

```
1. Connection      GET http://localhost:3066/api/test/connection
2. Client/STOCK    GET http://localhost:3066/api/test/visible-filters/client/STOCK
3. Admin/RELAMATION GET http://localhost:3066/api/test/visible-filters/admin/RECLAMATION
4. All Roles       GET http://localhost:3066/api/test/roles
5. All Modules     GET http://localhost:3066/api/test/modules
6. Stats           GET http://localhost:3066/api/test/stats
7. Module STOCK    GET http://localhost:3066/api/test/module/STOCK
8. Dashboard       GET http://localhost:3066/api/test/dashboard
```

---

## ✅ CHECKLIST

- [ ] SQL créée et exécutée (CREATE_AND_POPULATE_FILTERS.sql)
- [ ] filterService.js créé
- [ ] testFilterController.js créé
- [ ] testFilterRoutes.js créé
- [ ] Routes intégrées dans app.js
- [ ] Backend redémarré (npm start)
- [ ] TEST 1 (Connection) fonctionne ✅
- [ ] TEST 2 (Filters by role/module) retourne des données ✅
- [ ] TEST 3 (Visible filters only) retourne 3 pour client/STOCK ✅
- [ ] TEST 4 (Roles) retourne 5 rôles ✅
- [ ] TEST 5 (Modules) retourne 6 modules ✅
- [ ] TEST 6 (Stats) retourne 59 lignes ✅
- [ ] TEST 7 (Module filters) retourne tous les rôles ✅
- [ ] TEST 8 (Dashboard) retourne matrice complète ✅

---

## 🐛 TROUBLESHOOTING

**Si erreur "Table not found":**
```
→ Vérifier que CREATE_AND_POPULATE_FILTERS.sql a été exécutée
→ Vérifier que la table existe: SELECT * FROM dbo.TabRoleFilterVisibility
```

**Si erreur "Service not loaded":**
```
→ Vérifier le chemin du fichier filterService.js
→ Vérifier que require() est correct
```

**Si erreur 500 on /api/test/...**
```
→ Vérifier les logs du terminal (npm start)
→ S'assurer que sequelize est initialisé
→ Vérifier la connexion DB
```

---

## 🎯 PROCHAINES ÉTAPES (après validation des tests)

1. Adapter `productController.js` pour utiliser `filterService`
2. Adapter `reclamationController.js` pour utiliser `filterService`
3. Adapter les autres contrôleurs
4. Créer `useModuleFilters.js` hook React
5. Adapter les composants frontend (ProductsList, ClaimsList, etc.)

---
