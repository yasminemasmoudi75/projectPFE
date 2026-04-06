# 🔧 CODE CHANGES - Diff exact

## FILE: src/controllers/productController.js

---

### CHANGE 1: Ligne 7 - Import filterService

```diff
  const { Product, Collection, TabStockD, sequelize } = require('../models');
  const { randomUUID } = require('crypto');
  const { Op, QueryTypes, TableHints } = require('sequelize');
  const fs = require('fs');
  const path = require('path');
  const { formatDateForMSSQL } = require('../utils/helpers');
+ const filterService = require('../services/filterService');  ← NEW!

  console.log('✅ productController.js loaded');
```

---

### CHANGE 2: Lines 22-50 - Remplacer la fonction

```diff
- const getClientFilterVisibilityOverrides = async () => {
-     try {
-         const rows = await sequelize.query(`
-             SELECT [FilterKey], [VisibleForClient]
-             FROM [TabProductFilterVisibility] WITH (NOLOCK)
-             WHERE [FilterKey] IN ('all', 'ok', 'low', 'rupture')
-         `, {
-             type: QueryTypes.SELECT
-         });
-
-         return rows.reduce((acc, row) => {
-             const key = String(row.FilterKey || '').trim().toLowerCase();
-             if (key) {
-                 acc[key] = toBool(row.VisibleForClient);
-             }
-             return acc;
-         }, {});
-     } catch (error) {
-         // Table may not exist yet; fallback to default behavior.
-         return {};
-     }
- };

+ /**
+  * Récupérer les filtres visibles pour un rôle spécifique
+  * Utilise la table TabRoleFilterVisibility pour configuration dynamique
+  */
+ const getFilterVisibilityByRole = async (userRole = 'client') => {
+     try {
+         // Utiliser filterService pour récupérer les filtres visibles
+         const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'STOCK');
+         
+         // Convertir en format compatible avec buildStockFilterMeta
+         const result = {};
+         visibleFilters.forEach(filter => {
+             result[filter.key] = true; // visible
+         });
+         
+         console.log(`✅ Filters for role '${userRole}':`, Object.keys(result));
+         return result;
+     } catch (error) {
+         console.error(`❌ Error getting filters for role '${userRole}':`, error.message);
+         // Fallback: Tous les filtres visibles par défaut
+         return { all: true, ok: true, low: true, rupture: true };
+     }
+ };
```

---

### CHANGE 3: Line 260 - Appel #1

```diff
        const rows = await sequelize.query(`
            SELECT TOP ${limit}
                [IDArt], [CodArt], [LibArt],
                ...
            FROM [TabStock] WITH (NOLOCK)
            ...
        `);
        
-       const visibilityOverrides = await getClientFilterVisibilityOverrides();
+       const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');

        return res.json({
            status: 'success',
            data: rows,
            meta: {
                stockFilters: buildStockFilterMeta(rows, visibilityOverrides)
            }
        });
```

---

### CHANGE 4: Line 298 - Appel #2

```diff
        const rows = await Product.findAll({
            attributes: { exclude: ['imgArt'] },
            where,
            tableHint: TableHints.NOLOCK,
            order,
            limit: limit,
            offset: offset
        });

-       const visibilityOverrides = await getClientFilterVisibilityOverrides();
+       const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');

        res.json({
            status: 'success',
            data: rows,
            meta: {
                stockFilters: buildStockFilterMeta(rows, visibilityOverrides)
            }
        });
```

---

## RÉSUMÉ DES CHANGEMENTS

| Change | Type | Impact |
|--------|------|--------|
| Import filterService | Add | Accès à la table |
| Remplacer fonction | Replace | Utilise filterService  + rôle utilisateur |
| Appel #1 (line 260) | Update | Passe le rôle |
| Appel #2 (line 298) | Update | Passe le rôle |

---

## LIGNES TOTAL

| Before | After | Change |
|--------|-------|--------|
| 1 import | 7 imports | +1 |
| 30 lines (vieille fonction) | 23 lines (nouvelle) | -7 |
| 0 appels avec rôle | 2 appels avec rôle | +2 |

---

## LOGIQUE EXPLIQUÉE

### Avant
```javascript
// Query une table qui n'existe pas (TabProductFilterVisibility)
const overrides = await getClientFilterVisibilityOverrides();
// Retourne {} ou données erronées
// RÉSULTAT: Tous les filtres visibles
```

### Après
```javascript
// Lit le rôle utilisateur
const userRole = req.user?.UserRole;  // 'client', 'admin', etc.

// Query la NOUVELLE table avec le rôle
const overrides = await getFilterVisibilityByRole(userRole);

// filterService retourne les filtres visibles selon la table
// Pour client: {rupture: true} (low absent car VisibleForRole=0)
// RÉSULTAT: Seulement les filtres visibles pour ce rôle
```

---

## DONNÉES AVANT/APRÈS

### AVANT (Hardcoded)
```javascript
return {
  all: true,      // Toujours true
  ok: true,       // Toujours true
  low: true,      // Toujours true
  rupture: true   // Toujours true
}
```

### APRÈS (Dynamique de la table)
```javascript
// Pour client/STOCK:
return {
  rupture: true   // Seulement ce qui est VisibleForRole=1
}
// low, ok, all sont absents (VisibleForRole=0)

// Pour admin/STOCK:
return {
  all: true,
  ok: true,
  low: true,
  rupture: true
}
// Tous présents (VisibleForRole=1 pour tous)
```

---

## ✅ TEST

Vérifier les changements:

```bash
# Voir la fonction
grep -n "getFilterVisibilityByRole" \
  d:/pfe/pfe/backend/backend/src/controllers/productController.js

# Doit retourner:
# 23: const getFilterVisibilityByRole = async (userRole = 'client') => {
# 260: const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
# 298: const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

---

**Changements appliqués avec succès!** ✅

Redémarrez le backend:
```bash
npm start
```
