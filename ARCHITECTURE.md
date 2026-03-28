# Architecture Frontend - Nexus CRM

## 📐 Vue d'ensemble

Architecture frontend moderne basée sur React avec Redux Toolkit pour la gestion d'état, React Router pour le routing, et Tailwind CSS pour le styling.

## 🏗️ Principes architecturaux

### 1. **Modularité**
- Chaque module métier est indépendant
- Composants réutilisables dans `/components`
- Logique métier séparée de la présentation

### 2. **Séparation des responsabilités**
- **Composants** : Présentation uniquement
- **Slices Redux** : Gestion d'état
- **Services** : Appels API
- **Hooks** : Logique réutilisable

### 3. **Performance**
- Lazy loading des routes
- Code splitting automatique
- Memoization avec useMemo/useCallback

### 4. **Sécurité**
- Protection des routes avec ProtectedRoute
- Gestion automatique des tokens JWT
- Contrôle d'accès basé sur les rôles (RBAC)

## 📂 Structure détaillée

### `/src/app` - Configuration centrale

**store.js** - Redux store
```javascript
- Combine tous les reducers
- Configure Redux DevTools
- Middleware personnalisés
```

**router.jsx** - React Router
```javascript
- Définition des routes
- Lazy loading
- Protection des routes
- Layouts
```

**axios.js** - Instance Axios
```javascript
- Configuration de base
- Intercepteurs de requête (ajout token)
- Intercepteurs de réponse (refresh token)
- Gestion des erreurs
```

### `/src/auth` - Authentification

**authSlice.js** - État d'authentification
```javascript
- user, accessToken, refreshToken
- Actions: login, logout, getProfile
- Synchronisation avec localStorage
```

**authService.js** - API d'authentification
```javascript
- login(credentials)
- logout(refreshToken)
- getProfile()
- updateProfile(data)
- changePassword(data)
```

**ProtectedRoute.jsx** - Protection des routes
```javascript
- Vérifie l'authentification
- Récupère le profil si nécessaire
- Redirige vers /auth/login si non authentifié
```

### `/src/layouts` - Structures de pages

**AuthLayout.jsx**
- Layout pour pages de connexion
- Design split-screen
- Branding à droite

**DashboardLayout.jsx**
- Layout principal de l'application
- Sidebar + Navbar + Contenu
- Responsive

**Sidebar.jsx**
- Menu de navigation
- Filtrage par permissions
- Mobile responsive (Dialog)

**Navbar.jsx**
- Barre supérieure
- Notifications
- Menu utilisateur

### `/src/modules` - Modules métiers

Chaque module suit la même structure :

```
/module-name/
├── ComponentList.jsx    # Liste
├── ComponentDetail.jsx  # Détail
├── moduleSlice.js       # Redux slice
└── moduleService.js     # API calls (optionnel)
```

**Modules disponibles :**
- `dashboard/` - Vue d'ensemble
- `sales/` - Devis
- `crm/` - Projets
- `activities/` - Activités
- `messaging/` - Messages
- `ai-engine/` - Prédictions IA
- `users/` - Utilisateurs
- `profile/` - Profil

### `/src/components` - Composants réutilisables

**Structure :**
```
/components/
├── /ui/              # Composants de base
│   ├── Button.jsx
│   ├── Table.jsx
│   ├── Badge.jsx
│   └── Card.jsx
│
└── /feedback/        # Feedback utilisateur
    ├── LoadingSpinner.jsx
    ├── NotFound.jsx
    ├── Modal.jsx
    └── Alert.jsx
```

### `/src/hooks` - Hooks personnalisés

**useAuth.js**
```javascript
const { user, isAuthenticated, isAdmin } = useAuth();
```

**usePermission.js**
```javascript
const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODE);
```

### `/src/utils` - Utilitaires

**constants.js**
- Rôles, statuts, codes modules
- Constantes de l'application

**format.js**
- formatDate(), formatCurrency()
- formatPhone(), formatFileSize()

**permissions.js**
- hasPermission(), canView(), canCreate()
- filterMenuByPermissions()

## 🔄 Flux de données

### 1. Authentification

```
Login.jsx
  → dispatch(login(credentials))
    → authService.login()
      → API POST /auth/login
        → authSlice (update state)
          → localStorage (save tokens)
            → Navigate to /dashboard
```

### 2. Récupération de données

```
Component
  → useEffect()
    → dispatch(fetchData())
      → API GET /endpoint
        → slice (update state)
          → Component re-render
```

### 3. Refresh token automatique

```
API Request
  → Axios interceptor (add token)
    → API Response 401
      → Axios interceptor (catch)
        → POST /auth/refresh
          → Update accessToken
            → Retry original request
```

## 🎨 Styling

### Tailwind CSS

**Configuration personnalisée :**
- Couleurs primary/secondary
- Effets glassmorphism
- Animations personnalisées

**Conventions :**
- Utiliser les classes utilitaires
- Éviter le CSS personnalisé
- Responsive-first

### Animations

```javascript
// Tailwind classes
animate-fade-in
animate-slide-in
animate-scale-in

// Framer Motion (pour animations complexes)
import { motion } from 'framer-motion';
```

## 🔐 Sécurité

### 1. Tokens JWT

- **Access Token** : Stocké dans Redux + localStorage
- **Refresh Token** : Stocké dans Redux + localStorage
- Expiration automatique gérée par intercepteurs

### 2. RBAC (Role-Based Access Control)

```javascript
// Vérifier une permission
if (hasPermission(user, MODULE_CODES.DEVIS, ACTION_TYPES.CREATE)) {
  // Afficher le bouton "Créer"
}

// Filtrer le menu
const filteredMenu = filterMenuByPermissions(menuItems, user);
```

### 3. Protection des routes

```javascript
<Route element={<ProtectedRoute><Component /></ProtectedRoute>} />
```

## 📡 Communication avec le backend

### Configuration

```javascript
// .env
VITE_API_URL=http://localhost:5000/api
```

### Appels API

```javascript
// Via Redux Thunk
dispatch(fetchDevis({ page: 1, limit: 10 }));

// Direct (rare)
import axios from '@app/axios';
const response = await axios.get('/endpoint');
```

### Gestion des erreurs

```javascript
// Automatique via intercepteur
- 401 → Refresh token
- 403 → Toast "Accès refusé"
- 404 → Toast "Ressource non trouvée"
- 500 → Toast "Erreur serveur"
```

## 🚀 Optimisations

### 1. Code Splitting

```javascript
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
```

### 2. Memoization

```javascript
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### 3. Debouncing

```javascript
const debouncedSearch = useDebounce(searchTerm, 500);
```

## 📦 Build & Déploiement

### Build de production

```bash
npm run build
```

**Optimisations automatiques :**
- Minification
- Tree shaking
- Code splitting
- Asset optimization

### Variables d'environnement

```env
# Développement
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://api.nexuscrm.com/api
```

## 🧪 Tests (à implémenter)

### Structure recommandée

```
/src
├── /components
│   ├── Button.jsx
│   └── Button.test.jsx
```

### Outils suggérés

- **Vitest** - Test runner
- **React Testing Library** - Tests de composants
- **MSW** - Mock API

## 📚 Bonnes pratiques

### 1. Nommage

- **Composants** : PascalCase (Button.jsx)
- **Hooks** : camelCase avec préfixe use (useAuth.js)
- **Utilitaires** : camelCase (format.js)
- **Constantes** : UPPER_SNAKE_CASE

### 2. Organisation des imports

```javascript
// 1. Bibliothèques externes
import { useState } from 'react';
import { useDispatch } from 'react-redux';

// 2. Composants internes
import Button from '@components/ui/Button';

// 3. Hooks
import useAuth from '@hooks/useAuth';

// 4. Utilitaires
import { formatDate } from '@utils/format';

// 5. Styles (si nécessaire)
import './styles.css';
```

### 3. Gestion d'état

- **Local** : useState pour état du composant
- **Global** : Redux pour état partagé
- **Server** : Redux Thunk pour données API

## 🔧 Maintenance

### Mise à jour des dépendances

```bash
npm outdated
npm update
```

### Audit de sécurité

```bash
npm audit
npm audit fix
```

---

**Architecture créée le :** 2024
**Version :** 1.0.0

