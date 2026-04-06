# ✅ INTÉGRATION TabRoleFilterVisibility - ÉTAPES COMPLÈTES

## 📋 RÉSUMÉ DE CE QUI A ÉTÉ FAIT

### ✅ Fichiers créés:
1. **filterService.js** - Service générique pour interroger la table (455 lignes)
2. **testFilterController.js** - Contrôleur avec 8 endpoints de test (328 lignes)
3. **testFilterRoutes.js** - Routes pour tous les tests (23 lignes)

### ✅ Intégrations effectuées:
1. **routes/index.js** MODIFIÉ - Les routes testFilterRoutes sont maintenant montées
2. **TESTING_GUIDE.md** - Guide complet des 8 tests et leurs résultats attendus

---

## 🚀 INSTRUCTIONS POUR DÉMARRER

### ÉTAPE 1: Vérifier les fichiers

```bash
# Vérifier que les fichiers existent
ls backend/backend/src/services/filterService.js
ls backend/backend/src/controllers/testFilterController.js
ls backend/backend/src/routes/testFilterRoutes.js
```

**Résultat attendu:** Les 3 fichiers doivent exister ✅

---

### ÉTAPE 2: Exécuter le SQL (si pas encore fait)

Ouvrir **SQL Server Management Studio (SSMS)**:

1. Connecter à: `127.0.0.1` (ou `localhost`)
2. Ouvrir la base de données: **AA**
3. Exécuter: **CREATE_AND_POPULATE_FILTERS.sql**

```sql
-- Vérifier que les données sont bien insérées:
SELECT COUNT(*) as TotalRows FROM dbo.TabRoleFilterVisibility;
-- Résultat attendu: 59
```

---

### ÉTAPE 3: Démarrer le backend

```bash
cd d:\pfe\pfe\backend\backend
npm start
```

**Résultat attendu:**
```
✅ Server running on port 3066!
```

**Vérifier que le backend est accessible:**
```bash
curl http://localhost:3066/health
# Ou utiliser: Invoke-RestMethod http://localhost:3066/health
```

---

### ÉTAPE 4: Exécuter le script de test

En **PowerShell** (admin):

```powershell
cd d:\pfe\pfe\backend\backend
.\RUN_TESTS.ps1
```

**Ou avec Node/curl directement:**

```bash
# TEST 1: Connection
curl http://localhost:3066/api/test/connection

# TEST 8: Dashboard complet
curl http://localhost:3066/api/test/dashboard
```

---

## 📊 STRUCTURE DES FICHIERS

### Fichier: `filterService.js`

**Localisation:** `backend/backend/src/services/filterService.js`

**Fonctions disponibles:**

```javascript
// Tous les filtres (visible + caché) pour un rôle/module
getFilterVisibilityByRoleAndModule(userRole, moduleCode)
// Retour: [{key: 'all', label: 'Tous', visible: true, valueType: 'enum'}, ...]

// Seulement les filtres VISIBLES
getVisibleFiltersOnly(userRole, moduleCode)
// Retour: Idem, mais seulement les visible: true

// Formater les résultats pour l'API
buildFilterMetaFromDB(filters, counts)
// Retour: {all: {id, label, count, visible}, ok: {...}, ...}

// Tester la connexion
testConnection()
// Retour: {tableExists: true, totalRows: 59}

// Tous les filtres d'un module (tous les rôles)
getAllFiltersForModule(moduleCode)
// Retour: Filtres groupés par rôle

// Liste des rôles
getAllRoles()
// Retour: ['admin', 'client', 'commercial', ...]

// Liste des modules
getAllModules()
// Retour: ['STOCK', 'RECLAMATION', 'DEVIS', ...]

// Statistiques
getTableStats()
// Retour: {TotalRows, TotalRoles, TotalModules, TotalFilters, VisibleCount, HiddenCount}
```

---

### Fichier: `testFilterController.js`

**Localisation:** `backend/backend/src/controllers/testFilterController.js`

**Endpoints (8 tests):**

```
GET /api/test/connection              TEST 1: Test de connexion
GET /api/test/filters/:role/:module   TEST 2: Tous les filtres
GET /api/test/visible-filters/:role/:module  TEST 3: Filtres visibles
GET /api/test/roles                   TEST 4: Liste des rôles
GET /api/test/modules                 TEST 5: Liste des modules
GET /api/test/stats                   TEST 6: Statistiques
GET /api/test/module/:module          TEST 7: Tous les filtres d'un module
GET /api/test/dashboard               TEST 8: Dashboard complet
```

---

### Fichier: `testFilterRoutes.js`

**Localisation:** `backend/backend/src/routes/testFilterRoutes.js`

**Structure:**

```javascript
const express = require('express');
const router = express.Router();
const { 
  testConnection,
  getFiltersByRoleModule,
  getVisibleFilters,
  // ... etc
} = require('../controllers/testFilterController');

router.get('/connection', testConnection);
router.get('/filters/:role/:module', getFiltersByRoleModule);
// ... etc

module.exports = router;
```

---

## 🔧 INTÉGRATION DANS routes/index.js

**Vérifier que ces lignes existent:**

```javascript
// ↓ Importer les routes testFilterRoutes
const testFilterRoutes = require('./testFilterRoutes');

// Dans la section "Utiliser les routes":
router.use('/test', testFilterRoutes);  // ✅ Doit être présent
```

---

## ✅ CHECKLIST D'INTÉGRATION

- [ ] **SQL exécuté:** CREATE_AND_POPULATE_FILTERS.sql dans la DB AA
- [ ] **Files created:** Les 3 fichiers JS existent dans le projet
- [ ] **Routes integrated:** testFilterRoutes importé dans routes/index.js
- [ ] **Backend started:** npm start fonctionne sans erreur
- [ ] **TEST 1 ✅:** GET /api/test/connection retourne 59 rows
- [ ] **TEST 2 ✅:** GET /api/test/filters/client/STOCK retourne les filtres
- [ ] **TEST 3 ✅:** GET /api/test/visible-filters/client/STOCK filtre correctement
- [ ] **TEST 4 ✅:** GET /api/test/roles retourne les 5 rôles
- [ ] **TEST 5 ✅:** GET /api/test/modules retourne les 6 modules
- [ ] **TEST 6 ✅:** GET /api/test/stats retourne les statistiques
- [ ] **TEST 7 ✅:** GET /api/test/module/STOCK retourne tous les rôles
- [ ] **TEST 8 ✅:** GET /api/test/dashboard retourne la matrice complète

---

## 🎯 EXEMPLE DE RÉPONSE TEST 1

**Requête:**
```
GET http://localhost:3066/api/test/connection
```

**Réponse (200 OK):**
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

## 🐛 ERREURS POSSIBLES ET SOLUTIONS

### Erreur: "Cannot find module 'filterService'"
```
❌ CAUSE: Le fichier filterService.js n'existe pas
✅ SOLUTION: Créer backend/backend/src/services/filterService.js (déjà fait)
```

### Erreur: "Table not found"
```
❌ CAUSE: CREATE_AND_POPULATE_FILTERS.sql n'a pas été exécuté
✅ SOLUTION: Exécuter le SQL script dans SSMS sur la DB AA
```

### Erreur: "Connection refused on port 3066"
```
❌ CAUSE: Le backend n'est pas démarré
✅ SOLUTION: Lancer npm start dans backend/backend
```

### Erreur: 404 on /api/test/...
```
❌ CAUSE: Routes not mounted in index.js
✅ SOLUTION: Vérifier que testFilterRoutes est importé et router.use() est appelé
```

### Erreur: 500 Internal Server Error
```
❌ CAUSE: Problème de requête DB
✅ SOLUTION: 
   1. Vérifier les logs (npm start)
   2. Vérifier la connexion DB
   3. Vérifier le nom de la table (TabRoleFilterVisibility)
```

---

## 🔍 VÉRIFICATION MANUELLE

### Vérifier la table existe:
```sql
SELECT * FROM dbo.TabRoleFilterVisibility;
-- Doit retourner 59 rows
```

### Vérifier les données pour client/STOCK:
```sql
SELECT * FROM dbo.TabRoleFilterVisibility
WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK';
-- Doit retourner 4 rows (all, ok, low, rupture)
```

### Vérifier les données VISIBLES pour client/STOCK:
```sql
SELECT * FROM dbo.TabRoleFilterVisibility
WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK' AND VisibleForRole = 1;
-- Doit retourner 3 rows (all, ok, rupture visible; low caché)
```

---

## 📝 NOTES IMPORTANTES

1. **Idempotency:** Toutes les requêtes de test peuvent être lancées plusieurs fois sans problème
2. **No Authentication:** Les routes /api/test/* n'ont pas d'authentification (pour faciliter le test)
3. **Read-Only:** Les routes ne modifient pas les données, seulement les lisent
4. **Error Handling:** Toutes les fonctions retournent des tableaux vides au lieu de lever des erreurs
5. **Logging:** Chaque opération est loggée pour faciliter le débogage

---

## 🎯 PROCHAINES ÉTAPES (après validation)

Après avoir validé tous les tests:

### 1. Intégrer dans productController
```javascript
const filterService = require('../services/filterService');

// Dans la fonction listProducts:
const userRole = req.user.role;
const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'STOCK');

// Retourner les données avec la métadonnée des filtres
res.json({
  status: 'success',
  filters: visibleFilters,
  products: products,
});
```

### 2. Intégrer dans reclamationController
```javascript
// Même pattern que productController
const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'RECLAMATION');
```

### 3. Créer hook React
```javascript
// src/hooks/useModuleFilters.js
export const useModuleFilters = (moduleCode) => {
  const [filters, setFilters] = useState([]);
  
  useEffect(() => {
    // Appeler GET /api/test/visible-filters/:role/:module
    // Et mettre à jour les filtres disponibles
  }, [moduleCode]);
  
  return filters;
};
```

### 4. Adapter les composants frontend
```jsx
// ProductsList.jsx
const filters = useModuleFilters('STOCK');

return (
  <div>
    {filters.map(filter => (
      <FilterButton key={filter.key} label={filter.label} />
    ))}
  </div>
);
```

---

## 📞 SUPPORT

Si le backend ne démarre pas:
```bash
# Vérifier les dépendances
npm install

# Vérifier les erreurs
npm start 2>&1 | tail -50
```

Si les routes ne répondent pas:
```bash
# Vérifier que les routes sont bien montées
curl http://localhost:3066/api/

# Vérifier /test/connection spécifiquement
curl -v http://localhost:3066/api/test/connection
```

---

**À PRÉSENT: Exécuter le script de test!**
```powershell
.\RUN_TESTS.ps1
```
