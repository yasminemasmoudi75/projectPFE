# 🧪 GUIDE DE TEST : Système de Filtrage Centralisé

Ce guide vous explique comment tester les modifications apportées au système de filtrage.

## 1. Ce qui a changé (Résumé)

Auparavant, le backend utilisait des numéros "magiques" (comme `'5'` ou `'31'`) pour identifier les modules. Maintenant, il utilise des noms clairs :
- `STOCK` (Produits)
- `RECLAMATION` (SAV)
- `DEVIS` (Devis)
- `BCV` (Bons de Commande)
- `BLV` (Bons de Livraison)
- `FAV` (Factures)

La visibilité des filtres est maintenant incluse automatiquement dans les réponses de l'API.

---

## 2. Comment Tester (Pas à pas)

### Étape A : Démarrer le serveur
Dans votre terminal (à la racine du projet backend) :
```bash
npm start
```
Vérifiez qu'il n'y a pas d'erreurs au démarrage.

### Étape B : Tester un endpoint avec PowerShell ou cURL
Ouvrez un **nouveau terminal** et exécutez l'une des commandes suivantes pour voir les données et les filtres :

#### Pour les Produits :
```powershell
curl "http://localhost:3066/api/products"
```

#### Pour les Réclamations (SAV) :
```powershell
curl "http://localhost:3066/api/reclamations"
```

#### Pour les Devis :
```powershell
curl "http://localhost:3066/api/devis"
```

---

## 3. Ce qu'il faut vérifier dans la réponse

Dans la réponse JSON que vous recevez, vous verrez maintenant une section `meta` :

```json
{
  "status": "success",
  "pagination": { ... },
  "meta": {
    "filters": {
      "status_open": true,
      "status_progress": true,
      "priority_urgent": true
    }
  },
  "data": [ ... ]
}
```

### ✅ SUCCESS CRITERIA :
1. **La requête fonctionne** (Code 200 OK).
2. **La section `meta.filters` est présente**.
3. **Seuls les filtres configurés comme "Visibles"** pour votre rôle dans la table `TabRoleFilterVisibility` apparaissent avec la valeur `true`.

---

## 4. Pourquoi est-ce important ?

- **Frontend Dynamique** : Le frontend peut maintenant lire `meta.filters` pour savoir quels boutons de filtrage afficher ou cacher sans avoir de code "en dur".
- **Sécurité** : Les codes de modules sont maintenant cohérents entre le code et la base de données.
- **Maintenance** : Si vous voulez cacher un filtre pour un rôle, changez juste la valeur dans la table SQL, et l'API se mettra à jour instantanément sans changer le code.

---

**Si vous avez des erreurs "Module non trouvé", vérifiez que vous avez bien fait un `npm install`.**
