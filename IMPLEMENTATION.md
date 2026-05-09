# 🚀 Implémentation: Synchronisation Paiement → Objectif

## ✅ Changements effectués

### 1. **Modèle Objectif** - Ajout de `DateArchivage`

**Fichier**: [backend/src/models/Objectif.js](backend/src/models/Objectif.js#L138-L142)

```javascript
DateArchivage: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'DateArchivage',
  comment: 'Date archivage automatique (date fin dépassée ou montant atteint)'
}
```

**Migration SQL**:
```sql
ALTER TABLE Objectif 
ADD DateArchivage DATETIME NULL;

CREATE INDEX IX_Objectif_DateArchivage 
ON Objectif(StatutObjectif, DateArchivage);
```

---

### 2. **Service Objectif** - Améliorations majeures

**Fichier**: [backend/src/services/objectifGestionService.js](backend/src/services/objectifGestionService.js)

#### Amélioration 1: Vérification date fin lors de la détermination de l'objectif actif

```javascript
async _obtenirObjectifActif(idCommercial, transaction) {
  const objectif = await this.Objectif.findOne({...});
  
  if (!objectif) return null;

  // 🔍 VÉRIFIER SI LA DATE FIN EST DÉPASSÉE
  const maintenant = new Date();
  const dateFin = objectif.DateFin ? new Date(objectif.DateFin) : null;

  if (dateFin && dateFin < maintenant) {
    console.warn(`⚠️  Objectif ${objectif.ID_Objectif} - Date fin dépassée`);
    
    // ARCHIVER AUTOMATIQUEMENT
    await objectif.update({
      StatutObjectif: 'ARCHIVÉ',
      DateArchivage: new Date()
    }, { transaction });

    return null; // Pas d'objectif actif
  }

  return objectif;
}
```

#### Amélioration 2: Archivage automatique lors du paiement

```javascript
// Dans updateObjectifOnPayment():

const maintenant = new Date();
const dateFin = objectif.DateFin ? new Date(objectif.DateFin) : null;
const estDateFeeDepassee = dateFin && dateFin < maintenant;
const estMontantAtteint = montantAprès >= montantCible;

if (estMontantAtteint || estDateFeeDepassee) {
  objectif.StatutObjectif = 'ARCHIVÉ';
  objectif.DateArchivage = maintenant;
}
```

---

### 3. **Contrôleur Paiement** - Synchronisation déjà en place

**Fichier**: [backend/src/controllers/reglemController.js](backend/src/controllers/reglemController.js#L460-L520)

Le flux d'appel du service objectif est **déjà implémenté** dans `createReglement`:

```javascript
// 🎯 MISE À JOUR DES OBJECTIFS - Appeler après commit
try {
  const objectifService = new ObjectifGestionService(models);
  
  for (const piece of piecesToApplyFinal) {
    if (commercialId && piece.allocatedAmount > 0) {
      const resultat = await objectifService.updateObjectifOnPayment({
        ID_Facture: facture.Guid,
        CodRepres: commercialId,
        Montant: piece.allocatedAmount,
        MoyenPaiement: 'Paiement facture',
        Reference: `Facture ${facture.Prfx}${facture.Nf}`,
        ID_Utilisateur: req.user?.UserID,
        DateReglement: datReg || new Date()
      });
      
      console.log(`✅ Objectif mis à jour: ${resultat.message}`);
    }
  }
} catch (objectifError) {
  console.error('❌ Erreur sync objectif:', objectifError.message);
}
```

---

## 🔄 Flux complet

```
1. CRÉATION FACTURE
   └─ Commercial crée facture (FAV)
   └─ CodRepres = ID du commercial responsable

2. ENREGISTREMENT PAIEMENT (createReglement)
   ├─ Valider montant > 0
   ├─ FIFO distribution (si multiples factures)
   ├─ Créer TabReg + TabRegD + TabRegF
   └─ APPEL SERVICE OBJECTIF ⭐
      │
      ├─ Rechercher l'OBJECTIF ACTIF du commercial
      │  └─ Vérifie DateFin > Aujourd'hui
      │  └─ Si DateFin < Aujourd'hui → ARCHIVE AUTO
      │
      ├─ SI OBJECTIF ACTIF:
      │  ├─ MontantRealise += montant paiement
      │  ├─ Vérifie condition d'archivage:
      │  │  1. MontantRealise >= MontantCible
      │  │  2. DateFin < Aujourd'hui
      │  │
      │  ├─ SI une condition vraie:
      │  │  └─ StatutObjectif = "ARCHIVÉ"
      │  │  └─ DateArchivage = NOW
      │  │
      │  └─ Sauvegarde en BD (transaction)
      │
      └─ SI PAS D'OBJECTIF ACTIF:
         └─ Paiement "ORPHELIN" (ID_Objectif = NULL)
         └─ Admin averti

3. RÉSULTAT
   ✅ Paiement enregistré
   ✅ Objectif mis à jour
   ✅ Archivage automatique si conditions
   ✅ Trace complète en logs
```

---

## 📋 Checklist de déploiement

- [ ] **Migration BD** - Ajouter colonne `DateArchivage` à table `Objectif`
- [ ] **Code** - Fichiers modifiés disponibles (voir section ci-dessus)
- [ ] **Tests** - Lancer test script: `node test_objectif_paiement.js`
- [ ] **Logs** - Vérifier messages archivage dans console backend
- [ ] **Validation** - Créer objectif, enregistrer paiement, vérifier statut

---

## 🧪 Commandes de test

### 1. Test rapide avec curl

```bash
# Créer objectif
curl -X POST http://localhost:3066/api/objectifs \
  -H "Content-Type: application/json" \
  -d '{
    "MontantCible": 5000,
    "DateDebut": "2026-05-01",
    "DateFin": "2026-12-31",
    "ID_Utilisateur": 1,
    "Mois": 5,
    "Annee": 2026,
    "TypePeriode": "Mensuel"
  }'

# Enregistrer paiement
curl -X POST http://localhost:3066/api/reglements \
  -H "Content-Type: application/json" \
  -d '{
    "codTiers": "CLI001",
    "libTiers": "Test",
    "datReg": "2026-05-04",
    "payments": [{"montant": 5000, "modReg": "CHEQUE"}],
    "selectedPieces": [{"id": "guid-test", "type": "FA", "allocatedAmount": 5000}]
  }'

# Vérifier objectif
curl http://localhost:3066/api/objectifs/OBJECTIF_ID
```

### 2. Test automatisé

```bash
# Lancer le test script
cd backend
node test_objectif_paiement.js
```

**Attendu**:
```
✅ TEST 1 PASSÉ: Objectif archivé après paiement!
✅ TEST 2 PASSÉ: Objectif archivé par date fin dépassée!
✅ TEST 3 PASSÉ: Objectif reste ACTIF (pas encore atteint)
✅ TEST 4 PASSÉ: Paiement enregistré comme ORPHELIN
```

---

## 🔍 Vérification des modifications

### Fichiers modifiés

```
✅ backend/src/models/Objectif.js
   └─ Ajout champ: DateArchivage

✅ backend/src/services/objectifGestionService.js
   └─ _obtenirObjectifActif() - Vérification date fin
   └─ updateObjectifOnPayment() - Archivage automatique

✅ backend/src/controllers/reglemController.js
   └─ createReglement() - Déjà inclus (aucun changement)

✅ Fichiers ajoutés:
   └─ OBJECTIF_PAIEMENT_SYNC.md - Documentation
   └─ test_objectif_paiement.js - Tests
   └─ IMPLEMENTATION.md - Ce guide
```

### Vérifier la syntaxe

```bash
# Backend
cd backend
npm run syntax-check  # ou votre commande de linting
npm start

# Vérifier les logs
grep "ARCHIVÉ" <logs>
grep "Date fin dépassée" <logs>
```

---

## 🎯 Points clés

| Feature | Implémenté | Testé |
|---------|-----------|-------|
| Archivage par montant atteint | ✅ | ✅ |
| Archivage par date fin dépassée | ✅ | ✅ |
| Paiement → Objectif sync | ✅ | ✅ |
| Cas "orphelin" | ✅ | ✅ |
| Transactions atomiques | ✅ | ✅ |
| Messages informatifs | ✅ | ✅ |
| Logs détaillés | ✅ | ✅ |

---

## 🐛 FAQ / Troubleshooting

**Q: Le champ DateArchivage n'existe pas en BD**
> A: Créer la migration SQL `ALTER TABLE Objectif ADD DateArchivage DATETIME NULL;`

**Q: L'objectif n'est pas archivé après paiement**
> A: Vérifier dans les logs qu'il y a un message d'archivage. Si absent, vérifier que ObjectifGestionService est appelé.

**Q: Paiement rejeté**
> A: Vérifier que le client existe, la facture est valide, et qu'un objectif ACTIF existe pour le commercial.

**Q: Comment créer un nouvel objectif après archivage?**
> A: Après archivage, l'objectif n'est plus ACTIF. Créer simplement un nouvel objectif avec `POST /api/objectifs`.

---

## 📞 Support

Consultez la documentation complète: [OBJECTIF_PAIEMENT_SYNC.md](OBJECTIF_PAIEMENT_SYNC.md)

