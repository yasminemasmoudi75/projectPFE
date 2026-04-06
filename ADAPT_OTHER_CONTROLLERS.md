# 📋 ADAPTER LES AUTRES CONTRÔLEURS

Maintenant que ProductController utilise la table dynamiquement, adaptez les autres de la MÊME FAÇON.

---

## 🔧 PATTERN À COPIER

Voici le pattern utilisé dans productController.js:

### 1. Import filterService
```javascript
const filterService = require('../services/filterService');
```

### 2. Créer la fonction
```javascript
const getFilterVisibilityByRole = async (userRole = 'client', moduleCode) => {
    try {
        const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, moduleCode);
        const result = {};
        visibleFilters.forEach(filter => {
            result[filter.key] = true;
        });
        console.log(`✅ Filters for role '${userRole}' / module '${moduleCode}':`, Object.keys(result));
        return result;
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        return {};  // Fallback: pas de filtres spéciaux
    }
};
```

### 3. Utiliser dans la fonction liste
```javascript
const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client', 'MODULE_CODE');
```

---

## 📍 ADAPTER RECLAMATIONCONTROLLER.JS

### Fichier
`d:\pfe\pfe\backend\backend\src\controllers\reclamationController.js`

### Changes

**1. Import** (haut du fichier)
```javascript
+ const filterService = require('../services/filterService');
```

**2. Fonction**
```javascript
+ const getFilterVisibilityByRole = async (userRole = 'client') => {
+     try {
+         const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'RECLAMATION');
+         const result = {};
+         visibleFilters.forEach(filter => {
+             result[filter.key] = true;
+         });
+         return result;
+     } catch (error) {
+         return {};
+     }
+ };
```

**3. Utiliser** (dans getAllReclamations ou fonction similaire)
```diff
- const visibilityOverrides = await getOldFunction();
+ const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

---

## 📍 ADAPTER DEVISCONTROLLER.JS

### Fichier
`d:\pfe\pfe\backend\backend\src\controllers\devisController.js`

### Changes - IDENTIQUE mais avec 'DEVIS':

```javascript
// Import
const filterService = require('../services/filterService');

// Fonction
const getFilterVisibilityByRole = async (userRole = 'client') => {
    try {
        const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'DEVIS');
        const result = {};
        visibleFilters.forEach(filter => {
            result[filter.key] = true;
        });
        return result;
    } catch (error) {
        return {};
    }
};

// Utiliser
const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

---

## 📍 ADAPTER BCVCONTROLLER.JS

```javascript
const filterService = require('../services/filterService');

const getFilterVisibilityByRole = async (userRole = 'client') => {
    try {
        const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'BCV');
        // ...
    } catch (error) {
        return {};
    }
};
```

Module: `'BCV'` ← ATTENTION AU NOM!

---

## 📍 ADAPTER BLVCONTROLLER.JS

```javascript
const filterService = require('../services/filterService');

const getFilterVisibilityByRole = async (userRole = 'client') => {
    try {
        const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'BLV');
        // ...
    } catch (error) {
        return {};
    }
};
```

Module: `'BLV'` ← ATTENTION AU NOM!

---

## 📍 ADAPTER FAVCONTROLLER.JS

```javascript
const filterService = require('../services/filterService');

const getFilterVisibilityByRole = async (userRole = 'client') => {
    try {
        const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'FAV');
        // ...
    } catch (error) {
        return {};
    }
};
```

Module: `'FAV'` ← ATTENTION AU NOM!

---

## ✅ CHECKLIST D'ADAPTATION

- [ ] reclamationController.js
  - [ ] Import filterService
  - [ ] Créer getFilterVisibilityByRole('RECLAMATION')
  - [ ] Remplacer l'appel ancien

- [ ] devisController.js
  - [ ] Import filterService
  - [ ] Créer getFilterVisibilityByRole('DEVIS')
  - [ ] Remplacer l'appel ancien

- [ ] bcvController.js
  - [ ] Import filterService
  - [ ] Créer getFilterVisibilityByRole('BCV')
  - [ ] Remplacer l'appel ancien

- [ ] blvController.js
  - [ ] Import filterService
  - [ ] Créer getFilterVisibilityByRole('BLV')
  - [ ] Remplacer l'appel ancien

- [ ] favController.js
  - [ ] Import filterService
  - [ ] Créer getFilterVisibilityByRole('FAV')
  - [ ] Remplacer l'appel ancien

- [ ] Redémarrer backend: `npm start`
- [ ] Tester chaque nouveau contrôleur

---

## 🎯 RÉSUMÉ

Chaque contrôleur doit avoir:

1. **Import**
```javascript
const filterService = require('../services/filterService');
```

2. **Fonction** (copier-paste + changer MODULE_CODE)
```javascript
const getFilterVisibilityByRole = async (userRole = 'client') => {
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, 'MODULE_CODE');
    // format result...
};
```

3. **Utilisation** (dans la fonction liste)
```javascript
const visibilityOverrides = await getFilterVisibilityByRole(req.user?.UserRole || 'client');
```

---

## 📝 MODULES À ADAPTER

| Module | Code | Contrôleur |
|--------|------|-----------|
| Products | `STOCK` | productController ✅ DONE |
| Claims | `RECLAMATION` | reclamationController ⏳ TODO |
| Quotes | `DEVIS` | devisController ⏳ TODO |
| BCV | `BCV` | bcvController ⏳ TODO |
| BLV | `BLV` | blvController ⏳ TODO |
| FAV | `FAV` | favController ⏳ TODO |

---

## 🚀 PROCHAINES ÉTAPES

1. Adapter reclamationController.js
2. Adapter devisController.js
3. Adapter BCV/BLV/FAV
4. Tester chacun
5. L'interface affichera les filtres corrects selon la table!

---

**Utilisez le MÊME PATTERN pour tous les contrôleurs!** 💯
