# 💰 LOGIQUE DES PAIEMENTS/RÉGLEMENT - GUIDE ADMIN

## 📋 TABLE OF CONTENTS
1. [Structure des données](#structure-des-données)
2. [Logique de paiement](#logique-de-paiement)
3. [Rôles et permissions](#rôles-et-permissions)
4. [Comment l'admin marque les paiements](#comment-ladmin-marque-les-paiements)
5. [Exemples pratiques](#exemples-pratiques)

---

## 🗂️ Structure des données

### TabReg (Master - Réglement Principal)
```
IDReg          INT          Identifiant unique du réglement
DatReg         DATE         Date du réglement
CodTiers       VARCHAR(50)  Code client (ex: 'CLI001')
LibTiers       VARCHAR(255) Nom client (ex: 'Société ABC')
MntReg         FLOAT        Montant TOTAL du réglement
Payed          BOOLEAN      Flag: Est-ce que le réglement est payé? (0=Non, 1=Oui)
CUser          VARCHAR(255) Email/Login de qui a créé ce réglement
DatUser        DATE         Quand a-t-il été créé?
```

### TabRegD (Détail - Infos Bancaires)
```
ID             INT          Identifiant du détail
IDReg          INT          Lien à TabReg
MntDebit       FLOAT        Montant débité (facturé au client)
MntCredit      FLOAT        Montant crédité (PAYÉ par le client) ⭐
ModReg         VARCHAR(100) Mode de paiement (Virement, Chèque, CB, etc)
DatValeur      DATE         Date de valeur
Banque         VARCHAR(255) Nom de la banque
NumCompte      VARCHAR(100) Numéro de compte
```

### TabRegF (Pièces - Factures rattachées)
```
ID             INT          Identifiant
IDReg          INT          Lien à TabReg
NumPiece       VARCHAR(100) Numéro de facture (ex: 'FAV-2024-001')
MntPiece       FLOAT        Montant de la pièce
Solde          FLOAT        Solde restant
TypPiece       VARCHAR(100) Type (Devis, BCV, BLV, FAV)
```

---

## 💡 Logique de paiement

### Calcul du statut de paiement

```
MontantTotal = TabReg.MntReg
MontantPayé = SUM(TabRegD.MntCredit) de tous les détails
MontantRestant = MontantTotal - MontantPayé

Percentage = (MontantPayé / MontantTotal) × 100

Statut:
├─ "Payé" (100%) 
├─ "Presque payé" (75-99%)
├─ "Partiellement payé" (1-74%)
└─ "Non payé" (0%)
```

### Exemple concret

**Réglement #1:**
```
ClientName: "Société ABC"
MntReg: 1000€

Détails:
├─ Détail 1: MntCredit = 600€  (versement 1)
├─ Détail 2: MntCredit = 0€    (pas encore reçu)
└─ Détail 3: MntCredit = 0€    (pas encore reçu)

Calcul:
├─ MontantTotal = 1000€
├─ MontantPayé = 600 + 0 + 0 = 600€
├─ MontantRestant = 1000 - 600 = 400€
├─ Percentage = (600/1000) × 100 = 60%
└─ Statut = "Partiellement payé"
```

---

## 🔐 Rôles et permissions

### Matrice d'accès (TabAWProfileAccess - CodMod=51)

| Rôle | Voir | Créer | Modifier | Supprimer | Note |
|------|------|-------|----------|-----------|------|
| **Admin** | ✅ Tout | ✅ | ✅ (Marquer paiements) | ✅ | Contrôle complet |
| **Commercial** | ✅ Tout | ✅ | ✅ | ❌ | Peut enregistrer paiements |
| **Technicien** | ✅ Tout (lecture) | ❌ | ❌ | ❌ | Vue seulement |
| **Client** | ✅ Ses paiements | ❌ | ❌ | ❌ | Filtré automatiquement |
| **Agent** | ✅ Tout (lecture) | ❌ | ❌ | ❌ | Vue seulement |

### Code de module
```
CodMod = 51 = Module REGLEMENT
```

---

## 📍 Comment l'admin marque les paiements

### Méthode 1: Marquer comme "Totalement Payé"

**API Endpoint:**
```
PUT /api/reglements/:id
Content-Type: application/json

{
  "payed": true,
  "mntCredit": 1000
}
```

**Résultat:**
```
Avant:
├─ TabReg.Payed = false
├─ MontantPayé = 0€
└─ Statut = "Non payé"

Après:
├─ TabReg.Payed = true
├─ MontantPayé = 1000€ (mise à jour MntCredit dans TabRegD)
└─ Statut = "Payé" ✅
```

### Méthode 2: Enregistrer un paiement partiel

**API Endpoint:**
```
PUT /api/reglements/:id
Content-Type: application/json

{
  "mntCredit": 600
}
```

**Résultat:**
```
Avant:
├─ MntCredit = 0€
└─ Statut = "Non payé"

Après:
├─ MntCredit = 600€
└─ Statut = "Partiellement payé" (60%)
```

### Méthode 3: Marquer plusieurs paiements en batch

**API Endpoint:**
```
POST /api/reglements/batch-update
Content-Type: application/json

{
  "reglemIds": [1, 2, 3, 4],
  "markAsPayedTotal": true
}
```

**Résultat:**
```
Les 4 réglement seront marqués comme payés en une seule requête
├─ TabReg.Payed = true
├─ MntCredit = MntReg (montant total)
└─ Statut = "Payé"
```

---

## 🛠️ Exemples pratiques

### EXEMPLE 1: Client paie la facture entièrement

**Scénario:**
- Réglement créé pour "ACME Corp" : 5000€
- Client verse 5000€
- Admin doit marquer comme payé

**Étapes:**
```
1. Admin va à /reglements
2. Cherche "ACME Corp"
3. Clique sur la ligne (futur: détail view)
4. Remplit: mntCredit = 5000 ET Payed = true
5. Clique "Enregistrer paiement"
```

**Résultat affichage:**
```
ACME Corp
├─ Montant Total: 5000€
├─ Montant Payé: 5000€ ✅
├─ Montant Restant: 0€
├─ Progression: [████████████] 100%
└─ Statut: Payé (vert) 🟢
```

### EXEMPLE 2: Client paie partiellement

**Scénario:**
- Réglement créé pour "XYZ Ltd" : 10000€
- Client verse d'abord 3000€ (paiement 1)
- Puis 2000€ (paiement 2)
- Plus tard 5000€ (paiement 3 = solde)

**Étapes:**
```
JOUR 1 - Premier paiement:
├─ Admin: mntCredit = 3000€
├─ Affichage: "Partiellement payé" (30%)
└─ TabRegD.MntCredit change 0→3000

JOUR 5 - Deuxième paiement:
├─ Admin: mntCredit = 5000€ (3000 + 2000)
├─ Affichage: "Partiellement payé" (50%)
└─ TabRegD.MntCredit change 3000→5000

JOUR 10 - Solde complet:
├─ Admin: mntCredit = 10000€ ET Payed = true
├─ Affichage: "Payé" (100%)
└─ TabRegD.MntCredit change 5000→10000
```

### EXEMPLE 3: Client voit ses propres paiements seulement

**Scénario:**
- Admin voit: Tous les clients (ABC, XYZ, ACME, etc)
- Client "ABC" login:
  - Voit SEULEMENT réglement de "ABC"
  - Ne voit PAS "XYZ" ni "ACME"

**Backend Filter:**
```javascript
buildClientFilter(user) {
  // Si user.CodTiers = 'CLI001' (ABC)
  // Alors: WHERE CodTiers = 'CLI001'
  // Masque tous les autres clients
}
```

**Résultat:**
```
Admin voit:
├─ ABC: 1000€ (Non payé)
├─ XYZ: 5000€ (Payé)
└─ ACME: 3000€ (Partiellement payé)

Client ABC voit:
└─ ABC: 1000€ (Non payé) ← SEULEMENT le sien
```

---

## 🔄 Workflow complet

```
[Création du Réglement]
    ↓
   (Admin/Commercial ajoute un réglement)
    ↓
[Réglement créé - MntReg = X, MntCredit = 0]
    ↓
   (Client reçoit facture)
    ↓
[Client paie partiellement]
    ↓
   (Admin enregistre paiement: mntCredit += Y)
    ↓
[Réglement affiche: "Partiellement payé"]
    ↓
   (Client paie le solde)
    ↓
   (Admin marque: Payed = true, mntCredit = X)
    ↓
[Réglement affiche: "Payé" ✅]
    ↓
[Client voit sur son tableau: Montant Payé = X€, Restant = 0€]
```

---

## 📊 Permissions SQL

**Exécuter ce script pour ajouter les permissions:**

```sql
-- Script fourni dans: scripts/add-reglement-permissions.sql
EXEC sp_executesql N'INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt) 
VALUES (31, ''admin'', 1, 1, 1, 1)'
```

Vérifier les permissions:
```sql
SELECT * FROM TabAWProfileAccess WHERE CodMod = 51
ORDER BY ProfileUser;
```

---

## 🎯 Résumé

| Question | Réponse |
|----------|---------|
| Qui peut voir tous les paiements? | ✅ Admin |
| Qui peut voir juste ses paiements? | ✅ Client (filtrage auto) |
| Qui peut marquer un paiement payé? | ✅ Admin (via PUT /reglements/:id) |
| Comment ça se met à jour dans la BD? | TabRegD.MntCredit ← Admin rentre la valeur |
| Le client voit les mises à jour? | ✅ Oui (frontend rafraîchit auto) |
| Peut modifier plusieurs paiements? | ✅ Oui (batch-update) |

---

## 🚀 Prochaines étapes

**Frontend améliorations (futures):**
- [ ] Bouton "Enregistrer paiement" dans détail du réglement
- [ ] Modal avec champs mntCredit + ModReg + DatValeur
- [ ] Graphique de paiement par client
- [ ] Historique des versements
- [ ] Email notification client quand paiement reçu
