import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoadingSpinner from '../components/feedback/LoadingSpinner';

// Lazy loading des pages
const Login = lazy(() => import('../auth/Login'));
const Register = lazy(() => import('../auth/Register'));
const Dashboard = lazy(() => import('../modules/dashboard/Dashboard'));
const ClientsList = lazy(() => import('../modules/clients/ClientsList'));
const ClientDetail = lazy(() => import('../modules/clients/ClientDetail'));
const ClientForm = lazy(() => import('../modules/clients/ClientForm'));
const DevisList = lazy(() => import('../modules/sales/DevisList'));
const DevisDetail = lazy(() => import('../modules/sales/DevisDetail'));
const DevisForm = lazy(() => import('../modules/sales/DevisForm'));
const OrdersList = lazy(() => import('../modules/sales/OrdersList'));
const ProjetsList = lazy(() => import('../modules/crm/ProjetsList'));
const ProjetDetail = lazy(() => import('../modules/crm/ProjetDetail'));
const ProjetForm = lazy(() => import('../modules/crm/ProjetForm'));
const ActivitesList = lazy(() => import('../modules/activities/ActivitesList'));
const ActiviteForm = lazy(() => import('../modules/activities/ActiviteForm'));
const ActiviteDetail = lazy(() => import('../modules/activities/ActiviteDetail'));
const ProductsList = lazy(() => import('../modules/products/ProductsList'));
const ProductForm = lazy(() => import('../modules/products/ProductForm'));
const ProductDetail = lazy(() => import('../modules/products/ProductDetail'));
const ClaimsList = lazy(() => import('../modules/claims/ClaimsList'));
const ClaimDetail = lazy(() => import('../modules/claims/ClaimDetail'));
const ClaimForm = lazy(() => import('../modules/claims/ClaimForm'));
const Calendar = lazy(() => import('../modules/activities/CalendarView'));
const Objectifs = lazy(() => import('../modules/goals/Objectifs'));
const ObjectifForm = lazy(() => import('../modules/goals/ObjectifForm'));
const MessagesList = lazy(() => import('../modules/messaging/MessagesList'));

const IAPredictions = lazy(() => import('../modules/ai-engine/Predictions'));
const UsersList = lazy(() => import('../modules/users/UsersList'));
const UserForm = lazy(() => import('../modules/users/UserForm'));
const UserDetail = lazy(() => import('../modules/users/UserDetail'));
const Profile = lazy(() => import('../modules/profile/Profile'));
const NotFound = lazy(() => import('../components/feedback/NotFound'));


// Wrapper pour Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>{children}</Suspense>
);

const routes = [
  // Routes publiques (Authentification)
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'register',
        element: (
          <SuspenseWrapper>
            <Register />
          </SuspenseWrapper>
        ),
      },
      {
        path: '',
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },

  // Routes protégées (Dashboard)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'clients',
        element: (
          <SuspenseWrapper>
            <ClientsList />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'clients/new',
        element: (
          <SuspenseWrapper>
            <ClientForm />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'clients/edit/:id',
        element: (
          <SuspenseWrapper>
            <ClientForm />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'clients/:id',
        element: (
          <SuspenseWrapper>
            <ClientDetail />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'devis',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DevisList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <DevisForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <DevisForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'orders',
            element: (
              <SuspenseWrapper>
                <OrdersList />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <DevisDetail />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'projets',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <ProjetsList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <ProjetForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <ProjetForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <ProjetDetail />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'activites',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <ActivitesList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <ActiviteForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <ActiviteForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <ActiviteDetail />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <ProductsList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <ProductForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <ProductForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <ProductDetail />
              </SuspenseWrapper>
            ),
          }
        ]
      },
      {
        path: 'claims',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <ClaimsList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <ClaimForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <ClaimDetail />
              </SuspenseWrapper>
            ),
          }
        ]
      },
      {
        path: 'calendar',
        element: (
          <SuspenseWrapper>
            <Calendar />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'objectifs',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Objectifs />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <ObjectifForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <ObjectifForm />
              </SuspenseWrapper>
            ),
          }
        ]
      },
      {
        path: 'messages',

        element: (
          <SuspenseWrapper>
            <MessagesList />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'ia',
        element: (
          <SuspenseWrapper>
            <IAPredictions />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users',
        element: (
          <SuspenseWrapper>
            <UsersList />
          </SuspenseWrapper>
        ),
      },


      {
        path: 'users/new',
        element: (
          <SuspenseWrapper>
            <UserForm />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users/edit/:id',
        element: (
          <SuspenseWrapper>
            <UserForm />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <SuspenseWrapper>
            <UserDetail />
          </SuspenseWrapper>
        ),
      },

      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <Profile />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // Route 404
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
];

// Initialisation du router
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

/**
 * Composant AppRouter pour le support HMR et l'encapsulation du RouterProvider
 */
export const AppRouter = () => (
  <RouterProvider
    router={router}
    future={{
      v7_startTransition: true,
    }}
  />
);

// Export nommé du router pour accès direct si nécessaire (ex: tests, slice)
export { router };
