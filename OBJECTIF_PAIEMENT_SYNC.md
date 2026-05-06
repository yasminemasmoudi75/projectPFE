# 🎯 Synchronisation Paiement → Objectif Commercial

## 📋 Vue d'ensemble du flux

```
1. Commercial crée Bon de Commande (BCV)
2. BCV transformé en Facture (FAV)
3. Facture payée (Paiement)
4. ✅ Montant AUTOMATIQUEMENT ajouté à l'objectif actif
5. ✅ Objectif archivé AUTOMATIQUEMENT si:
   - Date fin dépassée OU
   - Montant réalisé >= montant cible
```

---

## 🔧 Logique implémentée

### 1️⃣ **Enregistrement du paiement** (`createReglement`)

Quand un paiement est créé via `POST /api/reglements`:

```javascript
// Pour chaque facture payée:
- Calcul du montant alloué (FIFO/Pro-rata)
- Appel du service objectif: objectifService.updateObjectifOnPayment()
- Paiement enregistré en BD
- Objectif mis à jour APRÈS commit
```

**Fichier**: [backend/src/controllers/reglemController.js](backend/src/controllers/reglemController.js#L460-L520)

### 2️⃣ **Mise à jour de l'objectif** (`updateObjectifOnPayment`)

Service qui gère la synchronisation:

```
A. Récupère l'objectif ACTIF du commercial
   └─ Vérifie que DateFin > Aujourd'hui
   └─ Si date fin dépassée → ARCHIVAGE AUTOMATIQUE ✅

B. Ajoute le montant du paiement à MontantRealise
   └─ Incrémente NombreReglementsLies

C. Vérifie les conditions d'archivage:
   1️⃣ Montant réalisé >= Montant cible
      → Statut = "ARCHIVÉ" + DateArchivage = NOW
   2️⃣ DateFin dépassée
      → Statut = "ARCHIVÉ" + DateArchivage = NOW

D. Sauvegarde l'objectif en BD (transaction)
   └─ Crée enregistrement de paiement lié
```

**Fichier**: [backend/src/services/objectifGestionService.js](backend/src/services/objectifGestionService.js#L80-L210)

---

## 📊 Structure de données

### Modèle Objectif

| Champ | Type | Description |
|-------|------|-------------|
| `ID_Objectif` | UUID | Clé primaire |
| `IdCont` | UUID | Commercial (FK) |
| `MontantCible` | DECIMAL | Montant à atteindre |
| `Montant_Realise_Actuel` | DECIMAL | ✅ MIS À JOUR par paiement |
| `DateDebut` | DATE | Début de période |
| `DateFin` | DATE | ✅ VÉRIFIÉE pour archivage |
| `StatutObjectif` | STRING | ACTIF / ARCHIVÉ |
| `DateArchivage` | DATE | ✅ NOUVEAU - date auto archivage |
| `NombreReglementsLies` | INT | Nombre de paiements appliqués |

### Relation Paiement → Objectif

```
TabReg (Paiement)
  ├─ IDReg (clé)
  ├─ CodTiers (client)
  ├─ MntReg (montant)
  ├─ DatReg (date)
  └─ ID_Objectif ← LIEN CRÉÉ lors du paiement

Objectif
  ├─ ID_Objectif
  ├─ IdCont (commercial)
  ├─ Montant_Realise_Actuel ← INCRÉMENTÉ
  ├─ StatutObjectif ← ARCHIVÉ si conditions
  └─ DateArchivage ← REMPLI si archivé
```

---

## 🚀 Cas d'usage

### Cas 1: Paiement partiel → Montant n'atteint pas la cible

```
Objectif initial:
  - MontantCible: 10 000 DT
  - MontantRealise: 0 DT
  - DateFin: 2026-12-31 (futur)
  - StatutObjectif: ACTIF

Paiement de 3 000 DT enregistré

Résultat:
  ✅ MontantRealise: 0 + 3 000 = 3 000 DT
  ✅ Progression: 30%
  ✅ StatutObjectif: ACTIF (pas encore atteint)
  ❌ DateArchivage: NULL
```

### Cas 2: Paiement final → Montant >= cible

```
Objectif:
  - MontantCible: 10 000 DT
  - MontantRealise: 7 500 DT (avant paiement)
  - DateFin: 2026-12-31
  - StatutObjectif: ACTIF

Paiement de 2 500 DT enregistré

Résultat:
  ✅ MontantRealise: 7 500 + 2 500 = 10 000 DT
  ✅ Progression: 100%
  🏆 StatutObjectif: ARCHIVÉ (montant atteint)
  🏆 DateArchivage: 2026-05-04 (NOW)
```

### Cas 3: Paiement après date fin dépassée

```
Objectif:
  - MontantCible: 10 000 DT
  - MontantRealise: 6 000 DT
  - DateFin: 2026-03-31 (DÉPASSÉE!)
  - StatutObjectif: ACTIF

Paiement de 1 000 DT enregistré

Résultat:
  ✅ MontantRealise: 6 000 + 1 000 = 7 000 DT
  ✅ Progression: 70%
  📅 StatutObjectif: ARCHIVÉ (date fin dépassée)
  📅 DateArchivage: 2026-05-04 (NOW)
  ⚠️  Message: "OBJECTIF ARCHIVÉ (date fin dépassée)"
```

### Cas 4: Pas d'objectif actif → Paiement orphelin

```
Commercial n'a pas d'objectif ACTIF

Paiement enregistré:
  ✅ Paiement créé avec Statut = ORPHELIN
  ✅ ID_Objectif: NULL
  ⚠️  Message: "Pas d'objectif actif pour ce commercial"
  📢 Admin averti pour créer un objectif
```

---

## 🔌 API Endpoints

### 1. Enregistrer un paiement

```bash
POST /api/reglements
Content-Type: application/json

{
  "codTiers": "CLI1557931125",
  "libTiers": "Client ACME",
  "datReg": "2026-05-04",
  "payments": [
    {
      "montant": 5000,
      "modReg": "CHEQUE",
      "echeance": "2026-05-10"
    }
  ],
  "selectedPieces": [
    {
      "id": "guid-facture-1",
      "type": "FA",
      "allocatedAmount": 5000
    }
  ]
}
```

**Réponse en cas de succès:**
```json
{
  "status": "success",
  "message": "Règlement enregistré avec succès",
  "data": {
    "totalAmount": 5000,
    "paymentStatus": "Payé"
  }
}
```

**Réponse si objectif archivé:**
```json
{
  "status": "success",
  "message": "Règlement enregistré avec succès",
  "logs": [
    "✅ Objectif mis à jour: Paiement enregistré. Progression: 100% - ✅ OBJECTIF ARCHIVÉ (montant cible atteint)"
  ]
}
```

### 2. Consulter un objectif

```bash
GET /api/objectifs/:id
```

**Réponse:**
```json
{
  "status": "success",
  "data": {
    "ID_Objectif": "uuid-xxx",
    "MontantCible": 10000,
    "Montant_Realise_Actuel": 10000,
    "StatutObjectif": "ARCHIVÉ",
    "DateArchivage": "2026-05-04T12:30:00Z",
    "Avancement": 100
  }
}
```

---

## ⚙️ Configuration et migrations

### Colonne nouvelle: `DateArchivage`

Si la table `Objectif` n'a pas cette colonne, créer une migration:

```sql
-- Migration SQL
ALTER TABLE Objectif 
ADD DateArchivage DATETIME NULL 
    DEFAULT NULL
    CONSTRAINT DF_DateArchivage DEFAULT (NULL);

-- Index pour performances
CREATE INDEX IX_Objectif_Statut_DateArchivage 
ON Objectif(StatutObjectif, DateArchivage);
```

---

## 🧪 Tests

### Test 1: Paiement simple

```bash
# 1. Créer un objectif
POST /api/objectifs
{
  "MontantCible": 1000,
  "DateDebut": "2026-05-01",
  "DateFin": "2026-12-31",
  "ID_Utilisateur": 1
}

# 2. Créer une facture (commercialize)
POST /api/fav
{
  "master": {
    "CodTiers": "CLI001",
    "TotTTC": 1000
  },
  "details": [...]
}

# 3. Enregistrer un paiement
POST /api/reglements
{
  "codTiers": "CLI001",
  "datReg": "2026-05-04",
  "payments": [{"montant": 1000}],
  "selectedPieces": [{"id": "facture-guid", "type": "FA", "allocatedAmount": 1000}]
}

# 4. Vérifier l'objectif
GET /api/objectifs/uuid-objectif
→ Doit voir: StatutObjectif = "ARCHIVÉ", DateArchivage remplie
```

---

## 📝 Logs et monitoring

### Logs d'archivage automatique

Quand un objectif est archivé:

```
[INFO] 💳 [PAIEMENT] Enregistrement: {"facture": "guid", "montant": 1000}
[INFO] 🎯 Objectif actif: {"id": "uuid", "montantCible": 1000, "dateFin": "2026-05-04"}
[INFO] 🏆 OBJECTIF ATTEINT EN MONTANT! {"montantCible": 1000, "montantAprès": 1000, "depassement": 0}
[INFO] ✅ Objectif mis à jour: Paiement enregistré. Progression: 100% - ✅ OBJECTIF ARCHIVÉ (montant cible atteint)
```

### Logs de date fin dépassée

```
[WARN] ⚠️  Objectif uuid - Date fin dépassée (2026-03-31), ARCHIVAGE AUTOMATIQUE
[INFO] 📅 DATE FIN DÉPASSÉE - ARCHIVAGE AUTOMATIQUE {"dateFin": "2026-03-31", "maintenant": "2026-05-04"}
[INFO] ✅ Objectif mis à jour: Paiement enregistré. Progression: 70% - ✅ OBJECTIF ARCHIVÉ (date fin dépassée)
```

---

## 🐛 Dépannage

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Objectif pas mis à jour après paiement | Service objectif pas appelé | Vérifier les logs du paiement, relancer manuel |
| `DateArchivage` NULL | Colonne pas en BD | Créer migration, redéployer |
| Pas d'objectif trouvé | Objectif n'est pas ACTIF | Vérifier StatutObjectif, créer nouvel objectif |
| Erreur transaction | Conflit BD | Vérifier les FK, relancer paiement |

---

## 📖 Autres ressources

- [ObjectifGestionService](backend/src/services/objectifGestionService.js)
- [Reglement Controller](backend/src/controllers/reglemController.js)
- [Objectif Model](backend/src/models/Objectif.js)
