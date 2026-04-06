# 🔗 GUIDE RAPIDE - Rendre les filtres dynamiques

## ✅ Ce qui a été fait

### 1. Adapter productController.js
```javascript
// AVANT: Query hardcodée directe
const visibilityOverrides = await getClientFilterVisibilityOverrides();

// APRÈS: Utilise filterService dynamiquement
const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

### 2. Import filterService
```javascript
const filterService = require('../services/filterService');
```

### 3. Nouvelle fonction getFilterVisibilityByRole
```javascript
const getFilterVisibilityByRole = async (userRole = 'client') => {
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'STOCK');
    // Retourne les filtres visibles selon le rôle et la table
};
```

---

## 📊 RÉSULTAT

**Avant:**
- Les filtres étaient toujours: `all`, `ok`, `low`, `rupture` (tous visibles)
- Hardcodé dans le contrôleur

**Après:**
- Les filtres dépendent de `TabRoleFilterVisibility`
- Pour `client/STOCK`: Seulement `all`, `ok`, `rupture` (low caché)
- Pour `admin/STOCK`: Tous les 4 filtres
- **Dynamique!** ✅

---

## 🧪 TESTER

### 1. Démarrer le backend
```bash
cd d:\pfe\pfe\backend\backend
npm start
```

### 2. Tester l'endpoint
```bash
# Pour client
curl "http://localhost:3066/api/products" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"

# Résultat attendu:
{
  "status": "success",
  "meta": {
    "stockFilters": {
      "all": { "visible": true, ... },
      "ok": { "visible": true, ... },
      "low": { "visible": false, ... },    ← HIDDEN!
      "rupture": { "visible": true, ... }
    }
  }
}
```

### 3. Frontend affichera correctement
```
ProductsList.jsx filtre automatiquement:
.filter((s) => stockFilterMeta?.[s.id]?.visible !== false)
// Ne montre que: all, ok, rupture (pas low!)
```

---

## 📝 RÉSUMÉ DES CHANGEMENTS

| Fichier | Changement | Impact |
|---------|-----------|--------|
| **productController.js** | Import + nouvelle fonction | ✅ Dynamique |
| **filterService.js** | Utilisé via getFilterVisibilityByRole | ✅ Lit la table |
| **ProductsList.jsx** | Aucun changement - utilise déjà .filter() | ✅ Fonctionne |
| **TabRoleFilterVisibility** | Table existante avec données | ✅ Source unique |

---

## ✨ Prochaines étapes

1. **Redémarrer le backend** pour appliquer les changements
2. **Tester avec un token client** pour vérifier que les filtres sont cachés
3. **Adapter les autres contrôleurs** (reclamation, devis, etc.) avec le même pattern

---

## 🔧 Adapter les autres contrôleurs

Pour `reclamationController.js`:
```javascript
// Importer filterService
const filterService = require('../services/filterService');

// Adapter la fonction
const getFilterVisibilityByRole = async (userRole = 'client') => {
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'RECLAMATION');
    // ...
};

// Utiliser dans getAllReclamations
const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

Même pattern pour DEVIS, BCV, BLV, FAV!

---

**La table contrôle maintenant la visibilité des filtres! 🎉**
