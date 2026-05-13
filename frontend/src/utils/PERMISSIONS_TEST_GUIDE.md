# 🧪 GUIDE COMPLET: TESTER LES PERMISSIONS

## 📖 Table des matières
1. [Comment tester dans la console](#console-test)
2. [Comment tester dans le navigateur](#browser-test)
3. [Matrice de test par rôle](#test-matrix)
4. [Cas d'utilisation réels](#real-cases)
5. [Débogage](#debugging)

---

## 🖥️ Comment tester dans la console {#console-test}

### Étape 1: Importer les fonctions de test

```javascript
// Dans la console du navigateur (F12 → Console)

import { runAllTests, testUsers } from './src/utils/permissionsTest.js';

// Exécuter tous les tests
runAllTests();
```

### Étape 2: Tester chaque rôle

```javascript
// Test 1: Vérifier si Admin a accès à tout
import { getModulePermissions } from './src/utils/permissions.js';
import { testUsers } from './src/utils/permissionsTest.js';
import { MODULE_CODES } from './src/utils/constants.js';

console.log('Permissions Admin pour CLIENTS:');
console.log(getModulePermissions(testUsers.admin, MODULE_CODES.CLIENTS));
```

**Output:**
```
{
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canValidate: true,
  canExport: true,
}
```

---

## 🌐 Comment tester dans le navigateur {#browser-test}

### Test 1: Tester l'affichage des boutons

```javascript
// Ajouter ce code dans votre composant React

import { usePermission } from '../hooks/usePermission';
import { MODULE_CODES } from '../utils/constants';

export const TestComponent = () => {
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.CLIENTS);
  
  console.log('✓ Can Create:', canCreate);
  console.log('✓ Can Edit:', canEdit);
  console.log('✓ Can Delete:', canDelete);

  return (
    <div>
      {canCreate && <button>➕ Créer</button>}
      {canEdit && <button>✏️ Éditer</button>}
      {canDelete && <button>🗑️ Supprimer</button>}
    </div>
  );
};
```

**Expected Results:**
- **Admin**: 3 boutons visibles ✅
- **Commercial**: 2 boutons (Créer, Éditer) ✅
- **Technicien**: 0 boutons ❌
- **Client**: 1 bouton (Créer) ✅

---

### Test 2: Changer le rôle de l'utilisateur et voir les changements

```javascript
// Dans le contexte/store Redux

// Simuler un Admin
localStorage.setItem('user', JSON.stringify({
  UserID: 1,
  UserRole: 'Admin',
  EmailPro: 'admin@test.com'
}));

// Rafraîchir la page → Voir tous les boutons

// Simuler un Technicien
localStorage.setItem('user', JSON.stringify({
  UserID: 3,
  UserRole: 'Technicien',
  EmailPro: 'tech@test.com'
}));

// Rafraîchir la page → Voir moins de boutons
```

---

## 📊 Matrice de test par rôle {#test-matrix}

### Rôle: ADMIN

| Action | Module | Résultat | Test |
|--------|--------|----------|------|
| VIEW | CLIENTS | ✅ | `canView(admin, CLIENTS) === true` |
| CREATE | CLIENTS | ✅ | `canCreate(admin, CLIENTS) === true` |
| EDIT | CLIENTS | ✅ | `canEdit(admin, CLIENTS) === true` |
| DELETE | CLIENTS | ✅ | `canDelete(admin, CLIENTS) === true` |
| VALIDATE | DEVIS | ✅ | `canValidate(admin, DEVIS) === true` |
| EXPORT | STOCK | ✅ | `canExport(admin, STOCK) === true` |

```javascript
// Vérifier que l'Admin a TOUTES les permissions
const adminPerms = getModulePermissions(testUsers.admin, MODULE_CODES.CLIENTS);
Object.values(adminPerms).every(perm => perm === true) // Should be: true
```

---

### Rôle: COMMERCIAL

| Action | Module | Résultat | Test |
|--------|--------|----------|------|
| VIEW | CLIENTS | ✅ | `canView(commercial, CLIENTS) === true` |
| CREATE | CLIENTS | ✅ | `canCreate(commercial, CLIENTS) === true` |
| EDIT | CLIENTS | ✅ | `canEdit(commercial, CLIENTS) === true` |
| DELETE | CLIENTS | ❌ | `canDelete(commercial, CLIENTS) === false` |
| VIEW | STOCK | ❌ | `canView(commercial, STOCK) === false` |
| VIEW | DEVIS | ✅ | `canView(commercial, DEVIS) === true` |
| CREATE | DEVIS | ✅ | `canCreate(commercial, DEVIS) === true` |

```javascript
// Vérifier les permissions Commercial
console.log('✓ Commercial peut voir CLIENTS:', canView(testUsers.commercial, MODULE_CODES.CLIENTS));
console.log('✓ Commercial peut créer CLIENTS:', canCreate(testUsers.commercial, MODULE_CODES.CLIENTS));
console.log('✗ Commercial ne peut pas supprimer CLIENTS:', !canDelete(testUsers.commercial, MODULE_CODES.CLIENTS));
```

---

### Rôle: TECHNICIEN

| Action | Module | Résultat | Test |
|--------|--------|----------|------|
| VIEW | ACTIVITES | ✅ | `canView(technicien, ACTIVITES) === true` |
| EDIT | ACTIVITES | ✅ | `canEdit(technicien, ACTIVITES) === true` |
| CREATE | ACTIVITES | ❌ | `canCreate(technicien, ACTIVITES) === false` |
| DELETE | ACTIVITES | ❌ | `canDelete(technicien, ACTIVITES) === false` |
| VIEW | CLIENTS | ❌ | `canView(technicien, CLIENTS) === false` |
| VIEW | SAV | ✅ | `canView(technicien, SAV) === true` |

```javascript
// Technicien ne peut que MODIFIER les activités
const techPerms = getModulePermissions(testUsers.technicien, MODULE_CODES.ACTIVITES);
console.log(techPerms);
// { canView: true, canCreate: false, canEdit: true, canDelete: false, ... }
```

---

### Rôle: CLIENT

| Action | Module | Résultat | Test |
|--------|--------|----------|------|
| VIEW | DEVIS | ✅ | `canView(client, DEVIS) === true` |
| CREATE | DEVIS | ✅ | `canCreate(client, DEVIS) === true` |
| EDIT | DEVIS | ❌ | `canEdit(client, DEVIS) === false` |
| DELETE | DEVIS | ❌ | `canDelete(client, DEVIS) === false` |
| VIEW | CLIENTS | ❌ | `canView(client, CLIENTS) === false` |
| VIEW | SAV | ✅ | `canView(client, SAV) === true` |

```javascript
// Client a accès limité
const clientPerms = getModulePermissions(testUsers.client, MODULE_CODES.DEVIS);
console.log(clientPerms);
// { canView: true, canCreate: true, canEdit: false, canDelete: false, ... }
```

---

## 💡 Cas d'utilisation réels {#real-cases}

### Cas 1: Afficher/Masquer un bouton "Créer"

**Code:**
```jsx
import { usePermission } from '../hooks/usePermission';
import { MODULE_CODES } from '../utils/constants';

const ClientList = () => {
  const { canCreate } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <div>
      {canCreate && (
        <button onClick={handleCreate} className="btn btn-primary">
          ➕ Nouveau client
        </button>
      )}
      {/* Liste des clients */}
    </div>
  );
};
```

**Comment tester:**
1. Login comme **Admin** → Bouton visible ✅
2. Login comme **Commercial** → Bouton visible ✅
3. Login comme **Technicien** → Bouton CACHÉ ❌
4. Login comme **Client** → Bouton CACHÉ ❌

---

### Cas 2: Éditer un formulaire selon les permissions

**Code:**
```jsx
const ClientForm = ({ client }) => {
  const { canEdit } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <form>
      <input 
        type="text" 
        value={client.name} 
        disabled={!canEdit}  // ← Désactiver si pas de permission
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" disabled={!canEdit}>
        Enregistrer
      </button>
    </form>
  );
};
```

**Comment tester:**
1. Login comme **Admin** → Champs actifs ✅
2. Login comme **Commercial** → Champs actifs ✅
3. Login comme **Technicien** → Champs désactivés ❌

---

### Cas 3: Protéger une page entière

**Code:**
```jsx
const ClientDetailsPage = () => {
  const { canView } = usePermission(MODULE_CODES.CLIENTS);

  if (!canView) {
    return <div>Accès refusé</div>;
  }

  return <div>Fiche client détaillée</div>;
};
```

**Comment tester:**
1. Essayer d'accéder à `/clients/123` comme **Admin** → Voir la page ✅
2. Essayer d'accéder à `/clients/123` comme **Technicien** → Message "Accès refusé" ❌

---

### Cas 4: Tableau avec actions contextuelles

**Code:**
```jsx
const InvoiceTable = ({ invoices }) => {
  const { canEdit, canDelete, canExport } = usePermission(MODULE_CODES.FACTURES);

  return (
    <table>
      <tbody>
        {invoices.map(invoice => (
          <tr key={invoice.id}>
            <td>{invoice.number}</td>
            <td>
              {canEdit && <button>✏️ Éditer</button>}
              {canDelete && <button>🗑️ Supprimer</button>}
              {canExport && <button>📤 Exporter</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Comment tester:**
1. Login comme **Admin** → 3 boutons par ligne ✅
2. Login comme **Commercial** → 2 boutons (Éditer + Exporter) ❌
3. Login comme **Technicien** → 0 bouton ❌

---

## 🐛 Débogage {#debugging}

### Avez-vous les bonnes permissions?

```javascript
// Ouvrir la console (F12)
// Vérifier les permissions actuelles

import { usePermission } from './hooks/usePermission';
import { MODULE_CODES } from './utils/constants';

// Appeler dans un composant
const { user, canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.CLIENTS);

console.log('User:', user);
console.log('Can Create:', canCreate);
console.log('Can Edit:', canEdit);
console.log('Can Delete:', canDelete);
```

### Vérifier le rôle de l'utilisateur

```javascript
// Dans le localStorage
console.log(JSON.parse(localStorage.getItem('user')));

// Ou dans le store Redux
console.log(store.getState().auth.user);
```

### Tester les cas limites

```javascript
// Tester avec des utilisateurs null/undefined
console.log(canCreate(null, MODULE_CODES.CLIENTS)); // Should be: false

// Tester avec module code invalide
console.log(canCreate(testUsers.admin, 9999)); // Should be: false (ou true pour admin?)

// Tester la casse des rôles
const user = { UserRole: 'ADMIN' }; // Uppercase
console.log(isAdmin(user)); // Should be: true (après normalisation)
```

---

## ✅ Checklist de test complet

- [ ] **Admin** a accès à TOUTES les modules avec TOUTES les permissions
- [ ] **Commercial** peut voir + créer + éditer pour: CLIENTS, DEVIS, PROJETS, ACTIVITES
- [ ] **Commercial** ne peut PAS supprimer
- [ ] **Technicien** peut voir + éditer (seulement) pour: ACTIVITES, SAV, STOCK
- [ ] **Technicien** ne peut pas voir CLIENTS, DEVIS, PROJETS
- [ ] **Client** peut voir DEVIS, SAV, MESSAGES
- [ ] **Client** peut créer (pour soumettre réclamations)
- [ ] **Client** ne peut pas éditer/supprimer
- [ ] Les boutons s'affichent/masquent correctement selon le rôle
- [ ] L'accès aux pages est bien contrôlé
- [ ] Les messages d'erreur "Accès refusé" s'affichent correctement

---

## 📝 Notes importantes

1. **Admin bypass**: L'Admin a TOUJOURS toutes les permissions (check early return)
2. **Casse insensible**: Les rôles sont normalisés en minuscules (`normalizeRole()`)
3. **Fallback**: Si le backend ne renvoie pas `user.permissions`, le frontend utilise `ROLE_MODULE_FALLBACK`
4. **Frontend vs Backend**: 
   - Frontend = affichage conditionnel (UX)
   - Backend = sécurité réelle (middleware)
5. **Test toujours les deux**: Vérifier que le bouton s'affiche AND que la requête soit bien rejetée au backend

---

## 🚀 Lancer les tests automatisés

```javascript
// Dans votre teste (Jest, Vitest, etc)

import { runAllTests } from './src/utils/permissionsTest.js';

describe('Permission Tests', () => {
  it('should run all permission tests', () => {
    expect(() => runAllTests()).not.toThrow();
  });
});

// Ou simplement dans la console
runAllTests(); // Voir tous les résultats
```

---

**Fait avec ❤️ | Version 1.0**
