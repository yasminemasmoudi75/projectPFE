# 🧪 GUIDE DE TEST : Système de Filtrage Centralisé (v2)

Ce guide vous explique comment tester la nouvelle logique de filtrage basée sur les rôles.

## 1. Ce qui a changé

- **Plus de table SQL externe** : Nous n'utilisons plus la table `TabRoleFilterVisibility`.
- **Logique Intégrée** : La visibilité des filtres est définie directement dans le code backend (`src/utils/filterDefinitions.js`).
- **Sécurité** : Nous vérifions toujours si le module est actif pour votre rôle dans `TABAWPROFILEACCESS`.

---

## 2. Comment Tester (Pas à pas)

### Étape A : Pull et Update
Assurez-vous d'avoir la dernière version du code :
```bash
git pull origin refactor-module-filters-final
```

### Étape B : Démarrer le serveur
```bash
npm start
```

### Étape C : Vérifier les résultats JSON
Exécutez cette commande (PowerShell) :
```powershell
curl "http://localhost:3066/api/products"
```

---

## 3. Vérification de la Visibilité (Logique Rôle)

### Si vous êtes connecté en tant que CLIENT :
- Le filtre `low` (Stock Faible) doit avoir `"visible": false`.
- Le filtre `priority_urgent` pour les réclamations doit avoir `"visible": false`.

### Si vous êtes connecté en tant qu'ADMIN ou AGENT :
- Tous les filtres doivent avoir `"visible": true`.

---

## 4. Structure de la réponse attendue

L'API doit maintenant renvoyer ceci :

```json
{
  "status": "success",
  "meta": {
    "stockFilters": {
      "all": { "id": "all", "label": "Tous", "visible": true, "count": 150 },
      "low": { "id": "low", "label": "Faible", "visible": false, "count": 10 }
    }
  },
  "data": [ ... ]
}
```

---

**C'est cette structure (`meta.stockFilters`) que votre frontend React attend pour faire disparaître les boutons.**
