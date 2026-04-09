# 💰 RÉGLEMENT - RÉSUMÉ EXÉCUTIF

## 🎯 QU'EST-CE QUE C'EST?

Le module **Réglement** permet de **tracker les paiements des clients** :

```
Client ABC          Admin voit          Client voit
├─ Facture: 1000€   ├─ Client ABC: 1000€ └─ Admin ne change rien
├─ Payé: 600€       ├─ Client XYZ: 5000€    Client voit juste le sien
└─ Restant: 400€    └─ Client DEF: 2000€
```

---

## 🎬 DÉMONSTRATION RAPIDE

### Scénario: Client paie une facture

```
[1] Client ABC doit 5000€
    ├─ Réglement créé: MntReg = 5000€, Payed = false
    └─ Affichage: "Non payé" 🔴

[2] Admin reçoit versement de 3000€
    ├─ Admin va à /reglements
    ├─ Cherche "ABC"
    ├─ Clique pour enregistrer: mntCredit = 3000€
    └─ Système met à jour MontantPayé = 3000€

[3] Affichage change automatique
    ├─ Montant Total: 5000€
    ├─ Montant Payé: 3000€
    ├─ Montant Restant: 2000€
    ├─ Progression: 60% [████████░░]
    └─ Statut: "Partiellement payé" 🟡

[4] Admin reçoit solde 2000€
    ├─ Admin: mntCredit = 5000€ + Payed = true
    └─ Affichage: "Payé" ✅ 100%
```

---

## 🔐 PERMISSIONS

### Quelle rôle peut faire quoi?

```
┌──────────┬──────────────────────────────────────┬─────────────────────┐
│  Rôle    │  Peut faire                          │  Voir               │
├──────────┼──────────────────────────────────────┼─────────────────────┤
│ Admin    │ ✅ Tout (créer/modifier/marquer     │ ✅ Tous les clients │
│          │    comme payé)                       │                     │
├──────────┼──────────────────────────────────────┼─────────────────────┤
│ Commercial│✅ Créer/modifier (pas supprimer)    │ ✅ Tous les clients │
├──────────┼──────────────────────────────────────┼─────────────────────┤
│ Client   │ ❌ Rien (juste lire)                │ ✅ Juste le SIEN    │
├──────────┼──────────────────────────────────────┼─────────────────────┤
│ Technicien│ ❌ Rien (juste lire)                │ ✅ Tous les clients │
├──────────┼──────────────────────────────────────┼─────────────────────┤
│ Agent    │ ❌ Rien (juste lire)                │ ✅ Tous les clients │
└──────────┴──────────────────────────────────────┴─────────────────────┘
```

**Code du module:** `31` (dans TabAWProfileAccess)

---

## 📊 STRUCTURE DONNÉES

### Exemple complet

**TabReg (Master):**
```
┌──────┬─────────┬───────────┬────────┬─────────────┬─────────┐
│ ID   │ Date    │ Client    │ Montant│ Payed       │ Créateur│
├──────┼─────────┼───────────┼────────┼─────────────┼─────────┤
│  1   │04/08/24 │ ABC Corp  │ 5000€  │ 0 (NON)     │ admin   │
│  2   │04/08/24 │ XYZ Ltd   │10000€  │ 0 (NON)     │ admin   │
│  3   │04/07/24 │ ACME Inc  │ 3500€  │ 1 (OUI) ✅  │ admin   │
└──────┴─────────┴───────────┴────────┴─────────────┴─────────┘
```

**TabRegD (Détail - Paiements):**
```
┌──────┬────────┬──────────────┬──────────────┬──────────┐
│ ID   │ IDReg  │ MntDebit     │ MntCredit    │ ModReg   │
├──────┼────────┼──────────────┼──────────────┼──────────┤
│  10  │   1    │ 5000€        │ 0€ ❌        │ Attente  │
│  11  │   2    │ 10000€       │ 6000€ 🟡    │ Virement │
│  12  │   3    │ 3500€        │ 3500€ ✅    │ Virement │
└──────┴────────┴──────────────┴──────────────┴──────────┘
```

**TabRegF (Pièces - Factures rattachées):**
```
┌──────┬────────┬────────────┬────────────┐
│ ID   │ IDReg  │ NumPiece   │ MntPiece   │
├──────┼────────┼────────────┼────────────┤
│  100 │   1    │ FAV-001    │ 5000€      │
│  101 │   2    │ FAV-002    │ 10000€     │
│  102 │   3    │ FAV-003    │ 3500€      │
└──────┴────────┴────────────┴────────────┘
```

---

## 🔄 FLUX DE TRAVAIL

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Admin crée réglement pour Client ABC (5000€)               │
│     → TabReg: MntReg=5000, Payed=false                         │
│     → TabRegD: MntCredit=0                                     │
│     → Affichage: "Non payé" (0%)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. Client ABC reçoit facture, paie 3000€                      │
│     Admin enregistre le paiement                               │
│     → TabRegD: MntCredit=3000                                  │
│     → Client paie, mais montant restant = 2000€                │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Affichage change automatiquement                            │
│     → Montant Payé: 3000€                                      │
│     → Montant Restant: 2000€                                   │
│     → Progression: 60%                                          │
│     → Statut: "Partiellement payé" 🟡                          │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Client paie solde 2000€                                    │
│     Admin marque comme "Payé"                                  │
│     → TabRegD: MntCredit=5000                                  │
│     → TabReg: Payed=true                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. Affichage final                                             │
│     → Montant Payé: 5000€ ✅                                    │
│     → Montant Restant: 0€                                      │
│     → Progression: 100%                                         │
│     → Statut: "Payé" ✅                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 API - LES 3 COMMANDES ESSENTIELLES

### 1️⃣ Voir TOUS les réglement
```bash
curl -X GET "http://localhost:3066/api/reglements" \
  -H "Authorization: Bearer <token>"

Réponse:
{
  "data": [
    { "id": 1, "client": "ABC", "totalAmount": 5000, "paymentStatus": "Non payé" },
    { "id": 2, "client": "XYZ", "totalAmount": 10000, "paymentStatus": "Partiellement payé" },
    { "id": 3, "client": "ACME", "totalAmount": 3500, "paymentStatus": "Payé" }
  ]
}
```

### 2️⃣ Enregistrer un paiement
```bash
curl -X PUT "http://localhost:3066/api/reglements/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mntCredit": 3000,
    "payed": false
  }'

Résultat:
- TabRegD.MntCredit = 3000€
- Affichage: "Partiellement payé" (60%)
```

### 3️⃣ Marquer comme TOTALEMENT PAYÉ
```bash
curl -X PUT "http://localhost:3066/api/reglements/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mntCredit": 5000,
    "payed": true
  }'

Résultat:
- TabRegD.MntCredit = 5000€
- TabReg.Payed = true
- Affichage: "Payé" (100%) ✅
```

---

## 🗄️ SQL - AJOUTER LES PERMISSIONS

```sql
-- Admin: accès complet
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'admin', 1, 1, 1, 1)

-- Commercial: créer/modifier seulement
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'commercial', 1, 1, 1, 0)

-- Client: lecture seulement
INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt)
VALUES (31, 'client', 1, 0, 0, 0)

-- Vérifier
SELECT * FROM TabAWProfileAccess WHERE CodMod = 51;
```

---

## 🎮 FRONTEND - CE QUE L'UTILISATEUR VOIT

### Admin
```
┌───────────────────────────────────────────────┐
│  💰 Réglement & Paiements                    │
├───────────────────────────────────────────────┤
│  📊 Statistiques:                            │
│  ├─ Nombre: 10 réglement                     │
│  ├─ Total: 50 000€                           │
│  ├─ Payé: 30 000€ (60% ✅)                   │
│  └─ Restant: 20 000€                         │
├───────────────────────────────────────────────┤
│  🔍 Filtres:                                  │
│  ├─ Recherche: [ABC          ]              │
│  └─ Statut: [Tous           ▼]              │
├───────────────────────────────────────────────┤
│  📋 Tableau:                                  │
│  ┌─────┬──────────┬─────────┬──────────┐   │
│  │Date │ Client   │ Montant │ Statut   │   │
│  ├─────┼──────────┼─────────┼──────────┤   │
│  │4/8  │ ABC Corp │ 5000€   │ Non payé │   │
│  │4/8  │ XYZ Ltd  │10000€   │ 60% payé │   │
│  │4/7  │ ACME Inc │ 3500€   │ Payé ✅  │   │
│  └─────┴──────────┴─────────┴──────────┘   │
└───────────────────────────────────────────────┘
```

### Client ABC
```
┌───────────────────────────────────────────────┐
│  💰 Mon Réglement                             │
├───────────────────────────────────────────────┤
│  📊 Statistiques (SEULEMENT LE SIEN):        │
│  ├─ Total: 5 000€                            │
│  ├─ Payé: 3 000€ (60% 🟡)                    │
│  └─ Restant: 2 000€                          │
├───────────────────────────────────────────────┤
│  📋 Tableau:                                  │
│  ┌─────┬──────────┬─────────┬──────────┐   │
│  │Date │ Montant  │ Payé    │ Statut   │   │
│  ├─────┼──────────┼─────────┼──────────┤   │
│  │4/8  │ 5000€    │ 3000€   │ Partiel  │   │
│  └─────┴──────────┴─────────┴──────────┘   │
└───────────────────────────────────────────────┘
```

**Note:** Le client ne voit QUE son réglement (filtrage automatique)

---

## ✅ CHECKLIST D'INSTALLATION

- [ ] Étape 1: Exécuter `scripts/add-reglement-permissions.sql`
- [ ] Étape 2: (Optionnel) Exécuter `scripts/add-reglement-testdata.sql`
- [ ] Étape 3: `npm start` (backend)
- [ ] Étape 4: `npm run dev` (frontend)
- [ ] Étape 5: Tester Admin voit tous les réglement
- [ ] Étape 6: Tester Admin enregistre un paiement (PUT /api/reglements/1)
- [ ] Étape 7: Tester Client voit seulement le sien

---

## 🐛 PROBLÈMES COURANTS

### ❌ Admin ne peut pas marquer comme payé
```
Vérifier: Dans reglemController.js
  if (access?.normalizedRole !== 'admin') {
    return 403; // ← Admin seulement
  }
```

### ❌ Client voit TOUS les clients
```
Vérifier: Permissions SQL pas ajoutées
  → Exécuter: scripts/add-reglement-permissions.sql
```

### ❌ Module import error
```
Vérifier: Chemins relatifs dans ReglemsList.jsx
  ✅ import useAuth from '../../hooks/useAuth'
  ❌ import { useAuth } from '../../../hooks/useAuth'
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails:
- **Logique:** `docs/REGLEMENT_LOGIC.md` (❓ Comment ça marche?)
- **Setup:** `docs/REGLEMENT_SETUP.md` (🔧 Comment installer?)

---

## 🎉 RÉSUMÉ EN 1 PHRASE

**Le module Réglement permet à l'Admin de tracker et enregistrer les paiements des clients, tandis que chaque Client voit SEULEMENT ses propres paiements.**

---
