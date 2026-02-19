# Nexus CRM - Frontend

Interface utilisateur React pour le système de gestion de la relation client Nexus CRM.

## 🚀 Technologies

- **React 18.2** - Bibliothèque UI
- **Vite 5.0** - Build tool ultra-rapide
- **Redux Toolkit 2.0** - Gestion d'état
- **React Router 6.21** - Routing
- **Tailwind CSS 3.4** - Framework CSS
- **Axios 1.6** - Client HTTP
- **React Hook Form 7.49** - Gestion des formulaires
- **Zod 3.22** - Validation de schémas
- **Headless UI 1.7** - Composants accessibles
- **Heroicons 2.1** - Icônes
- **Recharts 2.10** - Graphiques
- **Framer Motion 10.16** - Animations
- **React Hot Toast 2.4** - Notifications

## 📁 Structure du projet

```
frontend/
├── public/                 # Fichiers statiques
├── src/
│   ├── app/               # Configuration centrale
│   │   ├── store.js       # Redux store
│   │   ├── router.jsx     # React Router
│   │   └── axios.js       # Instance Axios
│   │
│   ├── auth/              # Authentification
│   │   ├── Login.jsx
│   │   ├── authSlice.js
│   │   ├── authService.js
│   │   └── ProtectedRoute.jsx
│   │
│   ├── layouts/           # Layouts
│   │   ├── AuthLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   │
│   ├── modules/           # Modules métiers
│   │   ├── dashboard/
│   │   ├── sales/         # Devis
│   │   ├── crm/           # Projets
│   │   ├── activities/    # Activités
│   │   ├── messaging/     # Messages
│   │   ├── ai-engine/     # IA
│   │   ├── users/
│   │   └── profile/
│   │
│   ├── components/        # Composants réutilisables
│   │   ├── ui/
│   │   └── feedback/
│   │
│   ├── hooks/             # Hooks personnalisés
│   │   ├── useAuth.js
│   │   └── usePermission.js
│   │
│   ├── utils/             # Utilitaires
│   │   ├── constants.js
│   │   ├── format.js
│   │   └── permissions.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env.example
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🛠️ Installation

### 1. Prérequis

- Node.js 18+ et npm
- Backend Nexus CRM en cours d'exécution

### 2. Installation des dépendances

```bash
cd frontend
npm install
```

### 3. Configuration

Créez un fichier `.env` à la racine du dossier `frontend` :

```bash
cp .env.example .env
```

Éditez le fichier `.env` :

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Nexus CRM
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

### 4. Démarrage

```bash
# Mode développement (avec hot reload)
npm run dev

# Build pour production
npm run build

# Prévisualiser le build de production
npm run preview
```

L'application sera accessible sur : **http://localhost:3000**

## 🔐 Authentification

### Connexion

L'application utilise JWT pour l'authentification :

1. Accédez à `/auth/login`
2. Entrez vos identifiants
3. Le token est stocké dans localStorage
4. Toutes les requêtes API incluent automatiquement le token

### Gestion des tokens

- **Access Token** : Valide 1 heure
- **Refresh Token** : Valide 7 jours
- Rafraîchissement automatique via intercepteur Axios

## 📊 Modules disponibles

### 1. Dashboard
- Vue d'ensemble des statistiques
- Activités récentes
- Prédictions IA

### 2. Devis
- Liste des devis
- Création/modification
- Probabilité de conversion IA
- Conversion en commande

### 3. Projets
- Gestion des projets commerciaux
- Suivi de l'avancement
- Alertes IA sur les retards

### 4. Activités
- Agenda des activités
- Appels, réunions, visites
- Suivi des tâches

### 5. Messages
- Messagerie interne
- Notifications
- Pièces jointes

### 6. IA Prédictions
- Prévisions de ventes
- Recommandations de relances
- Analyse de satisfaction
- Devis à fort potentiel

### 7. Utilisateurs
- Gestion des utilisateurs (Admin)
- Rôles et permissions

### 8. Profil
- Informations personnelles
- Changement de mot de passe

## 🎨 Personnalisation

### Thème Tailwind

Modifiez `tailwind.config.js` pour personnaliser les couleurs :

```javascript
colors: {
  primary: { ... },
  secondary: { ... },
}
```

### Alias de chemins

Les alias suivants sont configurés dans `vite.config.js` :

- `@` → `src/`
- `@components` → `src/components/`
- `@modules` → `src/modules/`
- `@layouts` → `src/layouts/`
- `@hooks` → `src/hooks/`
- `@utils` → `src/utils/`
- `@app` → `src/app/`
- `@auth` → `src/auth/`

Exemple d'utilisation :
```javascript
import useAuth from '@hooks/useAuth';
import Button from '@components/ui/Button';
```

## 🔒 Permissions (RBAC)

Le système utilise un contrôle d'accès basé sur les rôles :

```javascript
import usePermission from '@hooks/usePermission';

const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.DEVIS);

if (canCreate) {
  // Afficher le bouton "Créer"
}
```

## 📦 Build de production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`.

## 🐛 Débogage

### Redux DevTools

Redux DevTools est activé en mode développement.

### Logs Axios

Les requêtes/réponses HTTP sont loggées dans la console en développement.

## 📝 Scripts disponibles

```bash
npm run dev       # Démarrer en mode développement
npm run build     # Build pour production
npm run preview   # Prévisualiser le build
npm run lint      # Linter le code
```

## 🤝 Contribution

1. Créer une branche feature
2. Commiter les changements
3. Créer une Pull Request

## 📄 Licence

© 2024 Nexus CRM - Tous droits réservés

