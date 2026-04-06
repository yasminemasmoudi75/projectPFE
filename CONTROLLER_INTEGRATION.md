# 🔗 GUIDE D'INTÉGRATION - Utiliser filterService dans les contrôleurs

## 📍 Object: Montrer comment adapter les contrôleurs existants

Les fichiers de test (`testFilterController.js`, `testFilterRoutes.js`) sont **SEULEMENT pour valider** que la table fonctionne.

Maintenant, on va **intégrer la vraie logique** dans les contrôleurs existants.

---

## 🎯 PATTERN GÉNÉRAL

### Avant (Hardcoded):
```javascript
// productController.js (ancienne approche)
const getClientFilterVisibilityOverrides = async (req, res) => {
  // Requête SQL directe hardcodée pour client
  const filters = {
    all: { id: 1, label: 'Tous', visible: true },
    low: { id: 3, label: 'Faible', visible: false },  // ← Client ne voit pas celui-ci
    rupture: { id: 4, label: 'Rupture', visible: true },
  };
  return filters;
};
```

### Après (Basé sur DB):
```javascript
// productController.js (nouvelle approche)
const filterService = require('../services/filterService');

const getVisibleFiltersForUser = async (userRole, moduleCode) => {
  return await filterService.getVisibleFiltersOnly(userRole, moduleCode);
};
```

---

## 🛠️ INTÉGRATION PRODUCTCONTROLLER

### Localisation:
```
backend/backend/src/controllers/productController.js
```

### Adapter la fonction listProducts:

**AVANT:**
```javascript
exports.listProducts = async (req, res) => {
  try {
    const { filterType } = req.query;
    
    // Hardcoded filters
    const filters = {
      all: { id: 1, label: 'Tous' },
      ok: { id: 2, label: 'Dispo' },
      low: { id: 3, label: 'Faible' },
      rupture: { id: 4, label: 'Rupture' }
    };
    
    let query = Product.findAll();
    
    if (filterType === 'low') {
      query.where({ qte_alerte: { [Op.lte]: 5 } });
    }
    // ... autres conditions
    
    const products = await query.exec();
    
    res.json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
```

**APRÈS:**
```javascript
const filterService = require('../services/filterService');

exports.listProducts = async (req, res) => {
  try {
    const { filterType } = req.query;
    const userRole = req.user.role; // ← De l'authentification JWT
    const moduleCode = 'STOCK'; // ← Constante pour ce contrôleur
    
    // 🔄 RÉCUPÉRER les filtres VISIBLES pour ce rôle
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, moduleCode);
    
    // Mapper: convertir les filtres visibles en objet
    const filterMap = {};
    visibleFilters.forEach(f => {
      filterMap[f.key] = { id: f.key, label: f.label, visible: true };
    });
    
    // ✅ VÉRIFIER: Le filtre demandé est-il visible pour ce rôle?
    if (filterType && !filterMap[filterType]) {
      return res.status(403).json({
        status: 'error',
        message: `Filter '${filterType}' not visible for role '${userRole}'`
      });
    }
    
    let query = Product.findAll();
    
    // Appliquer le filtre demandé (si visible)
    if (filterType === 'ok') {
      query.where({ 
        [Op.and]: [
          { qte_disponible: { [Op.gt]: 0 } },
          { status: 'ACTIF' }
        ]
      });
    } else if (filterType === 'low') {
      query.where({ qte_alerte: { [Op.lte]: 5 } });
    } else if (filterType === 'rupture') {
      query.where({ qte_disponible: { [Op.lte]: 0 } });
    }
    
    const products = await query;
    
    res.json({
      status: 'success',
      count: products.length,
      filters: filterMap,  // ← Inclure dans la réponse
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
```

---

## 🛠️ INTÉGRATION RECLAMATIONCONTROLLER

### Localisation:
```
backend/backend/src/controllers/reclamationController.js
```

### Adapter la fonction listReclamations:

**APRÈS:**
```javascript
const filterService = require('../services/filterService');

exports.listReclamations = async (req, res) => {
  try {
    const { filterType } = req.query;
    const userRole = req.user.role;
    const moduleCode = 'RECLAMATION';
    
    // 🔄 RÉCUPÉRER les filtres VISIBLES
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, moduleCode);
    
    // Mapper les filtres
    const filterMap = {};
    visibleFilters.forEach(f => {
      filterMap[f.key] = { ...f, visible: true };
    });
    
    // ✅ VÉRIFIER: Le filtre est-il visible?
    if (filterType && !filterMap[filterType]) {
      return res.status(403).json({
        status: 'error',
        message: `Filter '${filterType}' not accessible`
      });
    }
    
    let query = Reclamation.findAll();
    
    // Appliquer les filtres
    if (filterType === 'open') {
      query.where({ status: { [Op.in]: ['OPEN', 'IN_PROGRESS'] } });
    } else if (filterType === 'closed') {
      query.where({ status: 'CLOSED' });
    } else if (filterType === 'priority_urgent') {
      query.where({ priority: 'URGENT' });
    }
    
    const reclamations = await query;
    
    res.json({
      status: 'success',
      count: reclamations.length,
      filters: filterMap,
      data: reclamations
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
```

---

## 🛠️ INTÉGRATION DEVISCONTROLLER

### Localisation:
```
backend/backend/src/controllers/devisController.js
```

### Exemple:

```javascript
const filterService = require('../services/filterService');

exports.listDevis = async (req, res) => {
  try {
    const { filterType } = req.query;
    const userRole = req.user.role;
    const moduleCode = 'DEVIS';
    
    // 🔄 RÉCUPÉRER les filtres VISIBLES
    const visibleFilters = await filterService.getVisibleFiltersOnly(userRole, moduleCode);
    
    const filterMap = {};
    visibleFilters.forEach(f => {
      filterMap[f.key] = f;
    });
    
    // ✅ VÉRIFIER
    if (filterType && !filterMap[filterType]) {
      return res.status(403).json({ status: 'error' });
    }
    
    let query = Devis.findAll();
    
    if (filterType === 'pending') {
      query.where({ status: 'PENDING' });
    } else if (filterType === 'accepted') {
      query.where({ status: 'ACCEPTED' });
    }
    
    const devis = await query;
    
    res.json({
      status: 'success',
      filters: filterMap,
      data: devis
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
```

---

## 🔧 POUR ALL OTHER CONTROLLERS

Adapter le même pattern pour:
- `bcvController.js` (module: 'BCV')
- `blvController.js` (module: 'BLV')
- `favController.js` (module: 'FAV')

```javascript
const filterService = require('../services/filterService');

// Au début de chaque fonction listX:
const visibleFilters = await filterService.getVisibleFiltersOnly(req.user.role, 'MODULE_CODE');

// Avant d'appliquer le filtre:
if (filterType && !visibleFilters.some(f => f.key === filterType)) {
  return res.status(403).json({ status: 'error' });
}
```

---

## 📱 INTÉGRATION FRONTEND - REACT HOOK

### Créer un nuevo hook:

```javascript
// src/hooks/useModuleFilters.js

import { useEffect, useState } from 'react';
import { authService } from '../auth/authService';

export const useModuleFilters = (moduleCode) => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3066/api/test/visible-filters/${authService.user?.role}/${moduleCode}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch filters');
        }
        
        const data = await response.json();
        setFilters(data.data.filters || []);
      } catch (err) {
        setError(err.message);
        setFilters([]); // Fallback: sin filtros específicos
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilters();
  }, [moduleCode]);
  
  return { filters, loading, error };
};
```

---

## 📦 USAR EL HOOK EN COMPONENTES

### ProductsList.jsx

```jsx
import { useModuleFilters } from '../hooks/useModuleFilters';

function ProductsList() {
  const { filters, loading } = useModuleFilters('STOCK');
  const [filterType, setFilterType] = useState('all');
  const [products, setProducts] = useState([]);
  
  const handleFilterChange = async (newFilterType) => {
    // ✅ VERIFICAR: ¿Está el filtro visible?
    const isVisible = filters.some(f => f.key === newFilterType);
    
    if (!isVisible && newFilterType !== 'all') {
      notification.error(`Filter '${newFilterType}' not available`);
      return;
    }
    
    setFilterType(newFilterType);
    
    // Actualizar productos con el nuevo filtro
    const response = await fetch(
      `/api/products?filterType=${newFilterType}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setProducts(data.data);
  };
  
  return (
    <div>
      <FilterBar>
        {filters.map(filter => (
          <FilterButton
            key={filter.key}
            label={filter.label}
            onClick={() => handleFilterChange(filter.key)}
            active={filterType === filter.key}
          />
        ))}
      </FilterBar>
      
      <ProductTable products={products} />
    </div>
  );
}
```

---

## 🔄 FLUJO COMPLETO

### Escenario: Client accede a products

1. **Frontend:**
   ```jsx
   const { filters } = useModuleFilters('STOCK');
   // Retorna: [{key: 'all', label: 'Todos'}, {key: 'ok', label: 'Disponible'}, {key: 'rupture', label: 'Ruptura'}]
   // NOTA: 'low' no aparece porque VisibleForRole=0 para client
   ```

2. **Click en "Ruptura":**
   ```
   GET /api/products?filterType=rupture
   ```

3. **Backend - productController.js:**
   ```javascript
   const visibleFilters = await filterService.getVisibleFiltersOnly('client', 'STOCK');
   // [{key: 'all', ..}, {key: 'ok', ..}, {key: 'rupture', ..}]
   
   if (!filterMap['rupture']) {
     return 403; // No visto
   }
   
   // Aplicar filtro
   const products = await Product.findAll({ where: { ... } });
   
   return {
     filters: filterMap,
     data: products
   };
   ```

4. **Frontend recibe:**
   ```json
   {
     "status": "success",
     "filters": {
       "all": {...},
       "ok": {...},
       "rupture": {...}
     },
     "data": [...]
   }
   ```

---

## ✅ VENTAJAS DE ESTA ARQUITECTURA

1. ✅ **Control centralizado:** Todos los permisos en una BD
2. ✅ **Sin hardcoding:** Cambiar visibilidad sin recompilar código
3. ✅ **Audit trail:** Tabla muestra qué es visible para quién
4. ✅ **Escalable:** Agregar nuevos módulos/filtros es trivial
5. ✅ **Consistencia:** Frontend y Backend usan las mismas reglas
6. ✅ **Seguridad:** Backend verifica SIEMPRE antes de devolver datos

---

## 📝 CHECKLISTE DE IMPLEMENTACIÓN

- [ ] productController.js adaptado
- [ ] reclamationController.js adaptado
- [ ] devisController.js adaptado
- [ ] bcvController.js adaptado
- [ ] blvController.js adaptado
- [ ] favController.js adaptado
- [ ] useModuleFilters.js creado
- [ ] ProductsList.jsx adaptado
- [ ] ClaimsList.jsx adaptado
- [ ] DevisList.jsx adaptado
- [ ] Prueba: Admin ve todos los filtros
- [ ] Prueba: Client ve solo 3 filtros en STOCK
- [ ] Prueba: Commercial ve sus filtros específicos

---
