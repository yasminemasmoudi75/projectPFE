## ✅ CHECKLIST - Intégration système Objectifs & Paiements

### Phase 1: Préparation et vérification (30 min)

- [ ] **Sauvegarder la base de données**
  ```bash
  # Créer backup avant migration
  ```

- [ ] **Vérifier les modèles existants**
  ```bash
  # Vérifier Objectif.js existe et a les bons champs
  # Vérifier pas de Reglement.js existant
  ls backend/src/models/
  ```

- [ ] **Vérifier sequelize config**
  ```javascript
  // Confirmer database.js exporte sequelize
  const { sequelize } = require('../config/database');
  ```

---

### Phase 2: Installer les fichiers (15 min)

- [ ] **1. Migration (ajout colonnes)**
  ```bash
  # Fichier: backend/src/migrations/20260504_add_objectif_status_fields.js
  # ✅ Créé
  ```

- [ ] **2. Modèle Reglement**
  ```bash
  # Fichier: backend/src/models/Reglement.js
  # ✅ Créé
  ```

- [ ] **3. Service métier**
  ```bash
  # Fichier: backend/src/services/objectifGestionService.js
  # ✅ Créé avec 3 fonctions core
  ```

- [ ] **4. Contrôleur API**
  ```bash
  # Fichier: backend/src/controllers/objectifGestionController.js
  # ✅ Créé avec 6 endpoints
  ```

- [ ] **5. Routes**
  ```bash
  # Fichier: backend/src/routes/objectifGestionRoutes.js
  # ✅ Créé avec auth + permissions
  ```

- [ ] **6. Documentation**
  ```bash
  # Fichier: backend/GUIDE_OBJECTIF_PAIEMENTS.md
  # ✅ Créé (ce guide)
  ```

---

### Phase 3: Modification des fichiers existants (45 min)

#### A) Enregistrer Reglement dans models/index.js

```javascript
// backend/src/models/index.js

const Objectif = require('./Objectif');
const Reglement = require('./Reglement');  // ← AJOUTER

module.exports = {
  Objectif,
  Reglement,  // ← AJOUTER
  // ... autres modèles existants
};
```

#### B) Monter routes dans app.js (ou server.js)

```javascript
// backend/src/app.js (OU backend/server.js)

const objectifGestionRoutes = require('./routes/objectifGestionRoutes');

// ← Ajouter après autres routes API
app.use('/api/objectifs', objectifGestionRoutes);
app.use('/api/reglements', objectifGestionRoutes);
```

#### C) Ajouter OBJECTIFS au MODULES (checkPermissions.js)

```javascript
// backend/src/middleware/checkPermissions.js

const MODULES = {
  // ... modules existants
  OBJECTIFS: {
    name: 'Objectifs Commerciaux',
    create: 3,
    read: 1,
    update: 2,
    delete: 4
  }
};

module.exports = { checkPermission, MODULES };
```

---

### Phase 4: Migration de base de données (10 min)

#### Option A: Via script Node.js directement

```bash
# Fichier: backend/run_migration.js
const { up } = require('./src/migrations/20260504_add_objectif_status_fields');

(async () => {
  try {
    await up();
    console.log('✅ Migration réussie');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
})();
```

```bash
# Exécuter
node backend/run_migration.js
```

#### Option B: Via Management Studio (si vous préférez)

```sql
-- Manuellement dans SQL Server Management Studio
ALTER TABLE Objectif
ADD 
  StatutObjectif VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
  DateClotureAdmin DATETIME NULL,
  IdUtilisateurClotureAdmin INT NULL,
  NombreReglementsLies INT NOT NULL DEFAULT 0;

-- Créer table Reglements
CREATE TABLE TabReglements (
  ID_Reglement UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  ID_Facture UNIQUEIDENTIFIER NOT NULL,
  ID_Objectif UNIQUEIDENTIFIER,
  CodRepres VARCHAR(10) NOT NULL,
  Montant DECIMAL(15,2) NOT NULL,
  DateReglement DATE NOT NULL DEFAULT GETDATE(),
  MoyenPaiement VARCHAR(50),
  Reference VARCHAR(100),
  Observations TEXT,
  ID_Utilisateur INT,
  DateCreation DATETIME NOT NULL DEFAULT GETDATE(),
  DateModification DATETIME NOT NULL DEFAULT GETDATE(),
  Statut VARCHAR(20) NOT NULL DEFAULT 'Enregistré'
);

-- Index pour performance
CREATE INDEX idx_Objectif_Commercial_Statut 
ON Objectif(IdCont, StatutObjectif);
```

---

### Phase 5: Tests (60 min)

#### Test 1: Paiement simple (happy path)

```bash
# Terminal 1: Démarrer serveur
cd backend
npm start

# Terminal 2: Test API
curl -X POST http://localhost:3066/api/reglements/enregistrer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ID_Facture": "550e8400-e29b-41d4-a716-446655440001",
    "CodRepres": "COM001",
    "Montant": 2500,
    "MoyenPaiement": "Virement",
    "Reference": "VIR2026001"
  }'

# Expected: 201 avec objectif_updated: true
```

#### Test 2: Créer objectif

```bash
curl -X POST http://localhost:3066/api/objectifs/creer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "IdCont": "550e8400-e29b-41d4-a716-446655440001",
    "MontantCible": 5000,
    "Annee": 2026,
    "Description": "Test objectif"
  }'

# Expected: 201 avec StatutObjectif: "ACTIF"
```

#### Test 3: Admin override

```bash
curl -X POST http://localhost:3066/api/objectifs/{objectifId}/fermer-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 avec StatutObjectif: "INACTIF"
```

#### Test 4: Vérifier historique

```bash
curl -X GET http://localhost:3066/api/objectifs/{idCommercial}/historique \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Liste objectifs avec statuts
```

---

### Phase 6: Vérification en base (10 min)

```sql
-- Vérifier colonnes ajoutées
SELECT TOP 5 
  ID_Objectif,
  IdCont,
  MontantCible,
  Montant_Realise_Actuel,
  StatutObjectif,
  DateClotureAdmin,
  IdUtilisateurClotureAdmin,
  NombreReglementsLies
FROM Objectif;

-- Vérifier table Reglements
SELECT TOP 5 * FROM TabReglements;

-- Vérifier index
SELECT * FROM sys.indexes 
WHERE name = 'idx_Objectif_Commercial_Statut';
```

---

### Phase 7: Intégration frontend (optionnel)

#### Composant React pour créer objectif

```jsx
// frontend/src/components/ObjectifForm.jsx
import { useState } from 'react';
import api from '../api';

export function ObjectifForm({ commercialId }) {
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/objectifs/creer', {
        IdCont: commercialId,
        MontantCible: parseFloat(montant),
        Annee: new Date().getFullYear(),
        Description: `Objectif ${new Date().toLocaleDateString('fr-FR')}`
      });

      alert('Objectif créé: ' + response.data.data.message);
      setMontant('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate}>
      <input
        type="number"
        value={montant}
        onChange={(e) => setMontant(e.target.value)}
        placeholder="Montant cible"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer objectif'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

---

### Phase 8: Surveillance en production

#### Logs à monitorer

```javascript
// Dans objectifGestionService.js, on a des logs:
console.log('💳 [PAIEMENT] Enregistrement');
console.log('🎯 Objectif actif');
console.log('🏆 OBJECTIF ATTEINT!');
console.log('🔐 [ADMIN OVERRIDE] Fermeture');
```

**Setup monitoring (optionnel):**
- Tracer tous les logs "OBJECTIF ATTEINT!" (succès)
- Alerter sur logs "ORPHELIN" (paiements sans objectif)
- Dashboard: Progression objectifs par commercial

---

### 🎯 Priorité des tâches

| Tâche | Priorité | Temps | Statut |
|-------|----------|--------|--------|
| Migration colonnes | 🔴 CRITIQUE | 10 min | À faire |
| Enregistrer Reglement | 🔴 CRITIQUE | 5 min | À faire |
| Monter routes | 🔴 CRITIQUE | 5 min | À faire |
| Tests API | 🟠 HAUTE | 20 min | À faire |
| Documentation équipe | 🟡 MOYENNE | 15 min | ✅ Faite |
| Frontend (optionnel) | 🟢 BASSE | 30 min | Optionnel |

---

### ❓ FAQ Implémentation

**Q: Quelle est l'ordre exactement?**
A: 
1. Créer fichiers (migration, modèles, service, contrôleur, routes)
2. Modifier fichiers existants (models/index, app.js, checkPermissions)
3. Exécuter migration
4. Tester

**Q: Peut-on faire sans migration?**
A: Non, les colonnes StatutObjectif, DateClotureAdmin, etc. sont REQUISES. La logique métier en dépend.

**Q: Qu'advient-il des objectifs existants?**
A: 
- La migration ajoute `StatutObjectif = 'ACTIF'` par défaut
- Les anciens objectifs hériteront "ACTIF" (ajustez manuellement si besoin)

**Q: Comment déboguer si ça ne marche pas?**
A:
```bash
# 1. Vérifier colonnes existent
SELECT * FROM Objectif WHERE ID_Objectif='...'

# 2. Vérifier routes chargées
curl http://localhost:3066/api/objectifs/test 2>&1 | grep -i error

# 3. Vérifier logs
tail -f backend/logs/app.log
```

---

### 📞 Support

Si problème:
1. Consulter GUIDE_OBJECTIF_PAIEMENTS.md (section Architecture)
2. Vérifier les logs (💳 [PAIEMENT], 🎯 Objectif, etc.)
3. Utiliser test SQL fournis ci-dessus
