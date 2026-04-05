# 🚀 EXÉCUTER LE SCRIPT SQL - GUIDE RAPIDE

## 📍 Fichiers créés

```
backend/backend/
├── SQL_COMPLETE_ALL_ROLES_ALL_MODULES.sql  ← Le script SQL
├── RUN_SQL.ps1                             ← Script PowerShell pour l'exécuter
└── EXECUTE_NOW.md                          ← Ce fichier
```

---

## ✨ OPTION 1: Exécuter avec PowerShell (Recommandé - 30 sec)

### Étape 1: Ouvrir PowerShell
```bash
# Ouvrir PowerShell comme Administrateur
# Aller dans le dossier backend
cd D:\pfe\pfe\backend\backend
```

### Étape 2: Exécuter le script
```powershell
# PowerShell:
.\RUN_SQL.ps1

# Résultat attendu:
# ✅ Script SQL exécuté avec succès!
# 📊 Tous les rôles et modules ont été insérés.
```

---

## 💻 OPTION 2: Exécuter dans SQL Server Management Studio

### Étape 1: Ouvrir SSMS
1. Lancer **SQL Server Management Studio**
2. Se connecter à la base de données

### Étape 2: Ouvrir le fichier SQL
1. **File** → **Open** → **File**
2. Sélectionner: `SQL_COMPLETE_ALL_ROLES_ALL_MODULES.sql`

### Étape 3: Exécuter
1. Vérifier que la bonne base est sélectionnée
2. **Execute** ou **F5**

### Résultat attendu
```
(96 rows affected)  -- 5 rôles × 16 modules + 1 = 96
```

---

## 🔍 VÉRIFIER QUE ÇA A MARCHÉ

Après exécution, le script auto-affiche les résultats. Sinon exécuter:

```sql
SELECT 
    ProfileUser,
    COUNT(*) as 'Nombre de Modules'
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
GROUP BY ProfileUser
ORDER BY ProfileUser;
```

**Résultat attendu:**
```
ProfileUser    Nombre de Modules
Admin          16
Agent          16
Client         16
Commerciale    16
Technicien     16
```

---

## ✅ APRÈS EXÉCUTION

### 1. Redémarrer le backend
```bash
cd D:\pfe\pfe\backend\backend
npm start
```

### 2. Redémarrer le frontend
```bash
cd D:\pfe\pfe\front
npm run dev
```

### 3. Tester dans l'app
- Ouvrir http://localhost:5173
- Login comme Admin → Voir tous les modules
- Login comme Commerciale → Pas de Stock ✅
- Login comme Technicien → Seulement Stock ✅
- Login comme Client → Seulement Devis ✅

---

## 🧪 TEST CONSOLE

```javascript
// F12 → Console

import { getModulePermissions } from './src/utils/permissions.js';

// Test Admin
console.log('Admin Devis:', getModulePermissions({UserRole: 'Admin'}, 4));
// { canView: true, canCreate: true, canEdit: true, canDelete: true }

// Test Commerciale
console.log('Commerciale Stock:', getModulePermissions({UserRole: 'Commerciale'}, 46));
// { canView: false, canCreate: false, canEdit: false, canDelete: false }

// Test Technicien
console.log('Technicien Stock:', getModulePermissions({UserRole: 'Technicien'}, 46));
// { canView: true, canCreate: false, canEdit: true, canDelete: false }
```

---

## 📊 RÉSUMÉ: PERMISSIONS APRÈS EXÉCUTION

| Rôle | Modules Actifs | Peut Créer | Peut Éditer | Peut Supprimer |
|------|---|---|---|---|
| **Admin** | 16 | 15 | 15 | 11 |
| **Commerciale** | 11 | 6 | 3 | 0 |
| **Technicien** | 3 | 0 | 1 | 0 |
| **Client** | 3 | 0 | 0 | 0 |
| **Agent** | 11 | 6 | 6 | 0 |

---

## ❌ PROBLÈMES?

### Erreur: "Command not found: sqlcmd"
```bash
# Solution: Utiliser SQL Server Management Studio à la place
# (Option 2 ci-dessus)
```

### Erreur: "Database not found"
```sql
-- Vérifier le nom de la base:
SELECT name FROM sys.databases;

-- Puis modifier RUN_SQL.ps1 ligne 8
$database = "VOTRE_BASE_DE_DONNEES"
```

### Erreur: "Login failed"
```bash
# Solution: Vérifier les credentials SQL Server
# Ou utiliser le user compte windows:
sqlcmd -S localhost -d PFE -E -i SQL_COMPLETE_ALL_ROLES_ALL_MODULES.sql
```

---

## ✨ FAIT! 

La table `TabAWProfileAccess` contient maintenant:
- ✅ Admin (16 modules, tous les droits)
- ✅ Commerciale (11 modules, ventes)
- ✅ Technicien (3 modules, support+stock)
- ✅ Client (3 modules, lecture)
- ✅ Agent (11 modules, commercial)

**Prochaine étape:** Tester les permissions dans l'app! 🎉
