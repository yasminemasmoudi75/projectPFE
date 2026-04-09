# 🚀 MODULE RÉGLEMENT - GUIDE D'INSTALLATION

## 📋 Fichiers créés/modifiés

### Backend ✅
```
✅ CRÉÉS:
  ├─ src/models/TabReg.js                    (Modèle Réglement Master)
  ├─ src/models/TabRegD.js                   (Modèle Détails Réglement)
  ├─ src/models/TabRegF.js                   (Modèle Pièces)
  ├─ src/controllers/reglemController.js     (Contrôleur avec endpoints)
  ├─ src/routes/reglements.routes.js         (Routes API)
  ├─ scripts/add-reglement-permissions.sql   (Ajouter permissions)
  ├─ scripts/add-reglement-testdata.sql      (Données de test)
  └─ docs/REGLEMENT_LOGIC.md                 (Documentation logique)

✅ MODIFIÉS:
  ├─ src/models/index.js                     (Ajout imports + relations)
  └─ src/routes/index.js                     (Ajout route /reglements)
```

### Frontend ✅
```
✅ CRÉÉS:
  ├─ src/modules/reglements/ReglemsList.jsx  (Composant principal)
  └─ src/modules/reglements/index.js         (Export)

✅ MODIFIÉS:
  ├─ src/app/router.jsx                      (Ajout route + import)
  └─ src/layouts/Sidebar.jsx                 (Ajout lien nav)
```

---

## 🔧 ÉTAPE 1: Ajouter les permissions dans la BD

**But:** Autoriser les rôles à accéder au module Réglement

### Option A: Exécuter le script SQL (recommandé)

```sql
-- Exécuter dans SQL Server Management Studio ou Azure Data Studio
-- Fichier: backend/scripts/add-reglement-permissions.sql

EXEC sp_executesql N'
  IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND ProfileUser = ''admin'')
  BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
    VALUES (31, ''admin'', 1, 1, 1, 1)
  END
'
-- ... (plus de détails dans le script)
```

### Option B: Manuellement

```sql
-- Ajouter Admin
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'admin', 1, 1, 1, 1)

-- Ajouter Commercial
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'commercial', 1, 1, 1, 0)

-- Ajouter Client
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'client', 1, 0, 0, 0)

-- Vérifier
SELECT * FROM TabAWProfileAccess WHERE CodMod = 51 ORDER BY ProfileUser;
```

**Où trouver CodMod=51?**
- Module REGLEMENT = Code 51
- Défini dans: `backend/src/middleware/checkPermissions.js`

---

## 📊 ÉTAPE 2: Ajouter les données de test (optionnel)

**But:** Avoir des réglement pour tester

### Exécuter le script SQL
```sql
-- Fichier: backend/scripts/add-reglement-testdata.sql
-- Crée 3 réglement:
-- ├─ Réglement #1: 5000€ NON PAYÉ
-- ├─ Réglement #2: 10000€ PARTIELLEMENT PAYÉ (60%)
-- └─ Réglement #3: 3500€ PAYÉ (100%)
```

**Vérifier:**
```sql
SELECT IDReg, LibTiers, MntReg, Payed FROM TabReg 
WHERE CUser = 'admin@test.com' 
ORDER BY IDReg DESC;
```

---

## 🎮 ÉTAPE 3: Lancer l'application

### Backend
```bash
cd backend/backend
npm start
```

Vérifier: Pas d'erreurs dans la console

### Frontend
```bash
cd front
npm run dev
```

Vérifier: Application démarre, pas d'erreurs Vite

---

## 🧪 ÉTAPE 4: Tester le module

### Test 1: Admin voit tous les réglement
```
1. Login comme Admin
2. Menu → Paiements (ou /reglements)
3. Doit voir tous les réglement avec stats
```

### Test 2: Client voit ses réglement seulement
```
1. Login comme Client
2. Menu → Paiements
3. Ne doit voir QUE ses réglement (filtrage automatique)
```

### Test 3: Admin enregistre un paiement
```
Exemple avec Postman/Insomnia:
PUT /api/reglements/1
{
  "mntCredit": 5000,
  "payed": true
}

Résultat:
├─ MontantPayé: 5000€
├─ MontantRestant: 0€
└─ Statut: "Payé" ✅
```

---

## 📱 API ENDPOINTS

### Lister les réglement
```http
GET /api/reglements?search=ABC&status=Payé&page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "date": "2024-04-08",
      "client": "ABC Corp",
      "totalAmount": 5000,
      "paidAmount": 5000,
      "remainingAmount": 0,
      "paymentStatus": "Payé",
      "paymentPercentage": 100
    }
  ],
  "pagination": { ... }
}
```

### Détail d'un réglement
```http
GET /api/reglements/1
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": {
    "id": 1,
    "client": "ABC Corp",
    "totalAmount": 5000,
    "paidAmount": 5000,
    "details": [...],
    "pieces": [...]
  }
}
```

### Enregistrer un paiement
```http
PUT /api/reglements/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "mntCredit": 5000,
  "payed": true
}

Response:
{
  "status": "success",
  "message": "Paiement mis à jour",
  "data": { ... }
}
```

### Enregistrer plusieurs paiements
```http
POST /api/reglements/batch-update
Authorization: Bearer <token>

{
  "reglemIds": [1, 2, 3],
  "markAsPayedTotal": true
}
```

### Statistiques
```http
GET /api/reglements/stats
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": {
    "totalDocuments": 10,
    "totalAmount": 50000,
    "totalPaid": 30000,
    "totalRemaining": 20000,
    "paymentPercentage": 60
  }
}
```

---

## 🎯 Logique CLIENT vs ADMIN

### Admin
```
✅ Voit: Tous les réglement de TOUS les clients
✅ Peut: Créer, modifier, supprimer, marquer comme payé
✅ Accès: Complet (canAdd=1, canEdit=1, canDelt=1)
```

### Commercial
```
✅ Voit: Tous les réglement
✅ Peut: Créer, modifier (pas supprimer)
✅ Accès: Lecture + écriture (canAdd=1, canEdit=1, canDelt=0)
```

### Client
```
✅ Voit: SEULEMENT ses propres réglement (filtré par CodTiers)
❌ Peut: Rien (juste consulter)
✅ Accès: Lecture seulement (canAdd=0, canEdit=0, canDelt=0)
```

### Technicien/Agent
```
✅ Voit: Tous les réglement (lecture)
❌ Peut: Rien (juste consulter)
✅ Accès: Lecture seulement (canAdd=0, canEdit=0, canDelt=0)
```

**Où c'est défini?**
- `backend/src/controllers/reglemController.js` → `buildClientFilter()`
- `backend/src/middleware/checkPermissions.js` → MODULES.REGLEMENT = 51

---

## 🐛 Dépannage

### Erreur: "Module Reglement not found"
```
✅ Solution: Exécuter le script SQL pour ajouter les permissions
   → scripts/add-reglement-permissions.sql
```

### Erreur: "Import path not found"
```
✅ Vérifier les imports dans ReglemsList.jsx:
   ❌ import { useAuth } from '../../../hooks/useAuth'  
   ✅ import useAuth from '../../hooks/useAuth'
```

### Client voit TOUS les réglement (pas filtré)
```
✅ Vérifier dans reglemController.js:
   const isClient = access?.normalizedRole === 'client';
   if (isClient) {
     const clientFilter = await buildClientFilter(req.user);
     where = clientFilter;  // ← Doit filtrer par CodTiers
   }
```

### Admin ne peut pas modifier les paiements
```
✅ Vérifier dans reglemController.js updateReglemPaymentStatus():
   if (access?.normalizedRole !== 'admin') {
     return res.status(403).json(...); // ← Admin seulement
   }
```

---

## 📚 Documentation complète

Pour plus de détails sur la logique des paiements, consultez:
```
backend/docs/REGLEMENT_LOGIC.md
```

Contient:
- Structure des données en détail
- Exemples pratiques
- Workflow complet
- FAQ

---

## ✅ Checklist de vérification

- [ ] Permissions SQL ajoutées (TabAWProfileAccess, CodMod=51)
- [ ] Backend démarre sans erreurs
- [ ] Frontend démarre sans erreurs  
- [ ] Menu "Paiements" visible dans Sidebar
- [ ] Route `/reglements` accessible
- [ ] Admin voit tous les réglement
- [ ] Client voit seulement ses réglement
- [ ] Admin peut enregistrer un paiement (PUT /api/reglements/:id)
- [ ] Stats cards affichent les bons chiffres
- [ ] Tableau affiche les réglement avec colonnes correctes
- [ ] Filtres (recherche, statut) fonctionnent
- [ ] Pagination fonctionne

---

## 🎉 Prochaines améliorations

**Frontend:**
- [ ] Détail réglement (cliquer pour voir détails + pièces)
- [ ] Modal "Enregistrer paiement" avec formulaire
- [ ] Graphique de paiement par mois
- [ ] Export PDF des réglement

**Backend:**
- [ ] Webhooks pour notifier client quand paiement reçu
- [ ] Historique des versements (audit trail)
- [ ] Rappels automatiques pour paiements en retard
- [ ] Intégration bancaire (import automatique)

---

## 👨‍💻 Support

Pour toute question ou issue:
1. Consulter `backend/docs/REGLEMENT_LOGIC.md`
2. Vérifier les logs dans le terminal (backend/frontend)
3. Exécuter les scripts de débogage SQL fournis
