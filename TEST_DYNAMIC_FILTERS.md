# 🧪 TEST - Vérifier que les filtres sont maintenant dynamiques

## ⚡ ÉTAPE 1: Arrêter le backend (s'il tourne)
```powershell
taskkill /F /IM node.exe
```

## ⚡ ÉTAPE 2: Démarrer le backend
```bash
cd d:\pfe\pfe\backend\backend
npm start
```

**Attendre le message:**
```
✅ Server running on port 3066!
✅ filterService loaded (ou message similar)
```

## ⚡ ÉTAPE 3: Tester un endpoint

En **PowerShell**, ouvrir un nouveau terminal et tester:

```powershell
# Obtenir les produits pour un client
curl "http://localhost:3066/api/products" `
  -Headers @{"Content-Type"="application/json"}

# Ou tester d'abord la connexion:
curl "http://localhost:3066/api/test/connection"
```

**Résultat attendu:**
```json
{
  "status": "success",
  "meta": {
    "stockFilters": {
      "all": { 
        "id": "all", 
        "label": "Tous", 
        "count": X,
        "visible": true 
      },
      "ok": { 
        "visible": true 
      },
      "low": { 
        "visible": false    ← CACHÉ POUR CLIENT!
      },
      "rupture": { 
        "visible": true 
      }
    }
  }
}
```

---

## ✅ VÉRIFICATION

### Si "low" a `visible: false` pour client → ✅ SUCCESS!
- La table est utilisée
- Le filtrage fonctionne
- Frontend affichera seulement 3 filtres

### Si tous ont `visible: true` → ❌ PROBLEM
- Vérifier que CREATE_AND_POPULATE_FILTERS.sql a été exécutée
- Vérifier que filterService.js existe
- Vérifier npm start logs

---

## 🐛 DÉBOGAGE

### Voir les logs
```bash
# Le terminal npm start affichera:
✅ Filters for role 'client': [ 'all', 'ok', 'rupture' ]
# (Notez que 'low' N'EST PAS dans la liste)
```

### Si erreur "Cannot find module 'filterService'"
```
→ Vérifier que filterService.js existe:
  d:\pfe\pfe\backend\backend\src\services\filterService.js
```

### Si erreur database
```
→ Vérifier que TabRoleFilterVisibility existe:
  SELECT * FROM dbo.TabRoleFilterVisibility
  WHERE ProfileUser='client' AND ModuleCode='STOCK'
```

---

## 🎉 SUCCESS CRITERIA

✅ Backend démarre sans erreur
✅ /api/products retourne status 'success'
✅ meta.stockFilters contient les 4 filtres
✅ low a visible: false pour client
✅ Frontend exclut les filtres hidden

---

**VOUS ÊTES BON À ALLER!** 🚀
