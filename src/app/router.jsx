import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import useAuth from '../hooks/useAuth';

// Role-based route guards
const AdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const NoClientRoute = ({ children }) => {
  const { isClient, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (isClient) return <Navigate to="/dashboard" replace />;
  return children;
};

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
const BcvList = lazy(() => import('../modules/sales/BcvList'));
const BcvDetail = lazy(() => import('../modules/sales/BcvDetail'));
const BcvForm = lazy(() => import('../modules/sales/BcvForm'));
const BlvList = lazy(() => import('../modules/sales/BlvList'));
const BlvDetail = lazy(() => import('../modules/sales/BlvDetail'));
const BlvForm = lazy(() => import('../modules/sales/BlvForm'));
const FavList = lazy(() => import('../modules/sales/FavList'));
const FavDetail = lazy(() => import('../modules/sales/FavDetail'));
const FavForm = lazy(() => import('../modules/sales/FavForm'));
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
const ClaimInterventionForm = lazy(() => import('../modules/claims/ClaimInterventionForm'));
const ReglemsList = lazy(() => import('../modules/reglements/ReglemsList'));
const Calendar = lazy(() => import('../modules/activities/CalendarView'));
const Objectifs = lazy(() => import('../modules/goals/Objectifs'));
const ObjectifForm = lazy(() => import('../modules/goals/ObjectifForm'));
const MessageInbox = lazy(() => import('../modules/messaging/MessageInbox'));

const IAPredictions = lazy(() => import('../modules/ai-engine/Predictions'));
const UsersList = lazy(() => import('../modules/users/UsersList'));
const UserForm = lazy(() => import('../modules/users/UserForm'));
const UserDetail = lazy(() => import('../modules/users/UserDetail'));
const Profile = lazy(() => import('../modules/profile/Profile'));
const MouvementsPage = lazy(() => import('../modules/mouvements/MouvementsPage'));
const ClientDocuments = lazy(() => import('../modules/sales/ClientDocuments'));
const NotFound = lazy(() => import('../components/feedback/NotFound'));
const ErrorElement = lazy(() => import('../components/feedback/ErrorElement'));



// Admin modules
const AdminDashboard = lazy(() => import('../modules/admin/AdminDashboard'));
const JournalConnexions = lazy(() => import('../modules/admin/JournalConnexions'));
const PermissionManager = lazy(() => import('../modules/admin/PermissionManagerPro'));
const StockConfigPage = lazy(() => import('../modules/admin/StockConfigPage'));

// Wrapper pour Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>{children}</Suspense>
);

const routes = [
  // Routes publiques (Authentification)
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <SuspenseWrapper><ErrorElement /></SuspenseWrapper>,
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
    errorElement: <SuspenseWrapper><ErrorElement /></SuspenseWrapper>,
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
          <NoClientRoute>
            <SuspenseWrapper>
              <ClientsList />
            </SuspenseWrapper>
          </NoClientRoute>
        ),
      },
      {
        path: 'clients/new',
        element: (
          <NoClientRoute>
            <SuspenseWrapper>
              <ClientForm />
            </SuspenseWrapper>
          </NoClientRoute>
        ),
      },
      {
        path: 'clients/edit/:id',
        element: (
          <NoClientRoute>
            <SuspenseWrapper>
              <ClientForm />
            </SuspenseWrapper>
          </NoClientRoute>
        ),
      },
      {
        path: 'clients/:id',
        element: (
          <NoClientRoute>
            <SuspenseWrapper>
              <ClientDetail />
            </SuspenseWrapper>
          </NoClientRoute>
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
        path: 'bcv',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <BcvList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <BcvForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <BcvForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <BcvDetail />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'blv',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <BlvList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <BlvForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <BlvForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <BlvDetail />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'fav',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <FavList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <FavForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <SuspenseWrapper>
                <FavForm />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <FavDetail />
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
              <NoClientRoute>
                <SuspenseWrapper>
                  <ProjetsList />
                </SuspenseWrapper>
              </NoClientRoute>
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
          },
          {
            path: ':id/intervention/new',
            element: (
              <SuspenseWrapper>
                <ClaimInterventionForm />
              </SuspenseWrapper>
            ),
          }
        ]
      },
      {
        path: 'reglements',
        element: (
          <SuspenseWrapper>
            <ReglemsList />
          </SuspenseWrapper>
        ),
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
            <MessageInbox />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'ia',
        element: (
          <NoClientRoute>
            <SuspenseWrapper>
              <IAPredictions />
            </SuspenseWrapper>
          </NoClientRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <AdminDashboard />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'admin/permissions',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <PermissionManager />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'admin/journal',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <JournalConnexions />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'admin/stock-config',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <StockConfigPage />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <UsersList />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'users/new',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <UserForm />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'users/edit/:id',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <UserForm />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <UserDetail />
            </SuspenseWrapper>
          </AdminRoute>
        ),
      },

      {
        path: 'mes-documents',
        element: (
          <SuspenseWrapper>
            <ClientDocuments />
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

      {
        path: 'mouvements',
        element: (
          <AdminRoute>
            <SuspenseWrapper>
              <MouvementsPage />
            </SuspenseWrapper>
          </AdminRoute>
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
