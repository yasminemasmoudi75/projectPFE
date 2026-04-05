# 📋 GUIDE: EXÉCUTER LE SCRIPT SQL POUR TOUS LES RÔLES

## 📍 Fichier SQL
📁 Localisation: `backend/backend/SQL_INSERT_ALL_ROLES_TABAWPROFILEACCESS.sql`

---

## 🚀 COMMENT EXÉCUTER

### Étape 1: Ouvrir SQL Server Management Studio
1. Lancer **SQL Server Management Studio (SSMS)**
2. Se connecter à votre base de donnée

### Étape 2: Ouvrir le fichier SQL
1. **File** → **Open** → **File**
2. Sélectionner: `SQL_INSERT_ALL_ROLES_TABAWPROFILEACCESS.sql`

### Étape 3: Exécuter le script
1. Vérifier que la bonne base est sélectionnée (dans le dropdown)
2. **Execute** ou **F5**

### Résultat attendu
```
(x rows affected)
```

---

## ✅ VÉRIFIER QUE ÇA A MARCHÉ

Exécuter cette requête de vérification:

```sql
SELECT 
    ProfileUser,
    CodMod,
    LibMod,
    Actif,
    canAdd,
    canEdit,
    canDelt
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
ORDER BY ProfileUser, CodMod;
```

**Résultat attendu:**
```
ProfileUser    CodMod  LibMod              Actif  canAdd  canEdit  canDelt
Admin          4       Module Devis        1      1       1        1
Admin          5       Module Commande     1      1       1        1
Admin          46      Stock               1      1       1        1
Commerciale    4       Module Devis        1      1       0        0
Commerciale    5       Module Commande     1      1       0        0
Client         4       Module Devis        1      0       0        0
Technicien     4       Module Devis        0      0       0        0
Technicien     46      Stock               1      0       1        0
Agent          4       Module Devis        1      1       1        0
...
```

---

## 📊 RÉSUMÉ DES PERMISSIONS APRÈS INSERTION

### ADMIN ✅ (TOUS LES DROITS)
```
Module 4 (Devis)      → Actif=1, Create=1, Edit=1, Delete=1
Module 5 (Commande)   → Actif=1, Create=1, Edit=1, Delete=1
Module 6 (Livraison)  → Actif=1, Create=1, Edit=1, Delete=1
Module 7 (Facture)    → Actif=1, Create=1, Edit=1, Delete=1
Module 30 (Client)    → Actif=1, Create=1, Edit=1, Delete=1
Module 31 (Réglement) → Actif=1, Create=1, Edit=1, Delete=1
Module 46 (Stock)     → Actif=1, Create=1, Edit=1, Delete=1
... (tous les autres)
```

### COMMERCIALE ✅ (VENTES)
```
Module 4 (Devis)      → Actif=1, Create=1, Edit=0, Delete=0
Module 5 (Commande)   → Actif=1, Create=1, Edit=0, Delete=0
Module 30 (Client)    → Actif=1, Create=1, Edit=1, Delete=0
Module 31 (Réglement) → Actif=1, Create=1, Edit=0, Delete=0
Module 46 (Stock)     → Actif=0, Create=0, Edit=0, Delete=0 ← PAS ACCÈS
```

### TECHNICIEN ✅ (SUPPORT)
```
Module 4 (Devis)      → Actif=0, Create=0, Edit=0, Delete=0 ← PAS ACCÈS
Module 30 (Client)    → Actif=0, Create=0, Edit=0, Delete=0 ← PAS ACCÈS
Module 46 (Stock)     → Actif=1, Create=0, Edit=1, Delete=0 ← ÉDITER SEULEMENT
```

### CLIENT ✅ (LECTURE)
```
Module 4 (Devis)      → Actif=1, Create=0, Edit=0, Delete=0 ← LECTURE SEULE
Module 7 (Facture)    → Actif=1, Create=0, Edit=0, Delete=0 ← LECTURE SEULE
Module 30 (Client)    → Actif=1, Create=0, Edit=0, Delete=0 ← LECTURE SEULE
Module 46 (Stock)     → Actif=0, Create=0, Edit=0, Delete=0 ← PAS ACCÈS
```

### AGENT ✅ (COMME COMMERCIAL)
```
Module 4 (Devis)      → Actif=1, Create=1, Edit=1, Delete=0
Module 5 (Commande)   → Actif=1, Create=1, Edit=1, Delete=0
Module 30 (Client)    → Actif=1, Create=1, Edit=1, Delete=0
Module 46 (Stock)     → Actif=0, Create=0, Edit=0, Delete=0 ← PAS ACCÈS
```

---

## 🧪 TESTER LES PERMISSIONS

### Test 1: Vérifier que Admin a ses permissions
```sql
SELECT * FROM TabAWProfileAccess
WHERE ProfileUser='Admin' AND CodMod=4;

-- Résultat attendu: Actif=1, canAdd=1, canEdit=1, canDelt=1
```

### Test 2: Vérifier que Technicien n'a pas Devis
```sql
SELECT * FROM TabAWProfileAccess
WHERE ProfileUser='Technicien' AND CodMod=4;

-- Résultat attendu: Actif=0, canAdd=0, canEdit=0, canDelt=0
```

### Test 3: Login et voir les permissions en action
1. Login comme Admin → Voir tous les modules
2. Login comme Commerciale → Pas de Stock
3. Login comme Technicien → Seulement Stock + Activités
4. Login comme Client → Seulement Devis/Facture

---

## 🔄 SI JE DOIS RECOMMENCER FROM SCRATCH

```sql
-- Supprimer les lignes ajoutées pour ces rôles
DELETE FROM TabAWProfileAccess 
WHERE LOWER(ProfileUser) IN ('admin', 'technicien', 'client', 'agent');

-- Puis réexécuter le script SQL
```

---

## 🎯 CAS D'USAGE: CACHER DEVIS À UN RÔLE

Après avoir exécuté ce script, pour cacher Devis à Commerciale:

```sql
-- Cacher Devis (CodMod=4)
UPDATE TabAWProfileAccess
SET Actif=0, canAdd=0, canEdit=0, canDelt=0
WHERE ProfileUser='Commerciale' AND CodMod=4;

-- Reconnexion pour voir le changement
```

---

## 📞 PROBLÈMES COURANTS

### Problème: "Duplicate key violation"
**Cause:** Les lignes existent déjà  
**Solution:** Le script utilise `WHERE NOT EXISTS`, donc il ignore les doublons

### Problème: Aucune ligne insérée
**Cause:** Les colonnes du `SELECT` ne matchent pas avec le `INSERT`  
**Solution:** Vérifier la structure de la table:
```sql
EXEC sp_help TabAWProfileAccess;
```

### Problème: Permission toujours pas visible
**Cause:** Cache du frontend  
**Solution:** 
1. Vider le localStorage
2. Rafraîchir la page (F5)
3. Reconnecter l'utilisateur

---

## ✨ MAINTENANT QUOI?

1. ✅ Exécuter le script SQL
2. ✅ Vérifier avec les requêtes de vérification
3. ✅ Tester les permissions dans l'application
4. ✅ Modifier les `Actif`, `canAdd`, `canEdit`, `canDelt` selon tes besoins
5. ✅ Pour Admin: remplacer le bypass Admin dans le code backend si tu veux que même Admin respecte cette table

---

**Fait!** La table `TabAWProfileAccess` contient maintenant TOUS les rôles. 🎉
