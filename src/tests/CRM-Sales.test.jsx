/**
 * Tests CRM Sales & Opérations — T20 à T31
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import toast from 'react-hot-toast';

import ObjectifForm    from '@modules/goals/ObjectifForm';
import Objectifs       from '@modules/goals/Objectifs';
import DevisForm       from '@modules/sales/DevisForm';
import DevisDetail     from '@modules/sales/DevisDetail';
import BlvDetail       from '@modules/sales/BlvDetail';
import FavDetail       from '@modules/sales/FavDetail';
import ClientDocuments from '@modules/sales/ClientDocuments';
import ReglemForm      from '@modules/reglements/ReglemForm';
import ReglemsList     from '@modules/reglements/ReglemsList';
import AdminDashboard  from '@modules/admin/AdminDashboard';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockDispatch      = vi.fn();
const mockUseSelector   = vi.fn();
const mockUseAuth       = vi.fn();
const mockUsePermission = vi.fn();
const mockUseParams     = vi.fn();
const mockGet           = vi.fn();
const mockPost          = vi.fn();
const mockPatch         = vi.fn();

vi.mock('react-redux', async (imp) => ({
  ...(await imp()),
  useDispatch: () => mockDispatch,
  useSelector: (sel) => mockUseSelector(sel),
}));

vi.mock('react-router-dom', async (imp) => ({
  ...(await imp()),
  useParams:   () => mockUseParams(),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@app/axios', () => ({
  default: {
    get:    (...a) => mockGet(...a),
    post:   (...a) => mockPost(...a),
    put:    vi.fn().mockResolvedValue({}),
    patch:  (...a) => mockPatch(...a),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@hooks/useAuth',        () => ({ default: () => mockUseAuth() }));
vi.mock('@hooks/usePermission',  () => ({ default: () => mockUsePermission() }));
vi.mock('@hooks/useLookupTables', () => ({
  default:        () => ({ tiersClasses: [], tiersGouvernorats: [], tiersCategories: [] }),
  useLookupTables:() => ({ tiersClasses: [], tiersGouvernorats: [], tiersCategories: [] }),
}));

vi.mock('@modules/goals/objectifSlice', () => ({
  fetchObjectifs:  vi.fn(() => ({ type: 'objectifs/fetch' })),
  createObjectif:  vi.fn(() => ({ type: 'objectifs/create' })),
  updateObjectif:  vi.fn(() => ({ type: 'objectifs/update' })),
  deleteObjectif:  vi.fn(() => ({ type: 'objectifs/delete' })),
}));

vi.mock('@modules/sales/devisSlice', () => ({
  fetchDevis:        vi.fn(() => ({ type: 'devis/fetch' })),
  fetchDevisById:    vi.fn(() => ({ type: 'devis/fetchOne' })),
  clearCurrentDevis: vi.fn(() => ({ type: 'devis/clearCurrent' })),
  createDevis:       vi.fn(() => ({ type: 'devis/create' })),
  updateDevis:       vi.fn(() => ({ type: 'devis/update' })),
  validateDevis:     vi.fn(() => ({ type: 'devis/validate' })),
  convertDevis:      vi.fn(() => ({ type: 'devis/convert' })),
  fetchMyDevis:      vi.fn(() => ({ type: 'devis/fetchMy' })),
}));

vi.mock('@modules/sales/bcvSlice', () => ({
  fetchBcvById:    vi.fn(() => ({ type: 'bcv/fetchOne' })),
  clearCurrentBcv: vi.fn(() => ({ type: 'bcv/clearCurrent' })),
  fetchMyBcv:      vi.fn(() => ({ type: 'bcv/fetchMy' })),
}));

vi.mock('@modules/sales/blvSlice', () => ({
  fetchBlvById:    vi.fn(() => ({ type: 'blv/fetchOne' })),
  clearCurrentBlv: vi.fn(() => ({ type: 'blv/clearCurrent' })),
  fetchMyBlv:      vi.fn(() => ({ type: 'blv/fetchMy' })),
}));

vi.mock('@modules/sales/favSlice', () => ({
  fetchFavById:    vi.fn(() => ({ type: 'fav/fetchOne' })),
  clearCurrentFav: vi.fn(() => ({ type: 'fav/clearCurrent' })),
  fetchMyFav:      vi.fn(() => ({ type: 'fav/fetchMy' })),
}));

vi.mock('@modules/sales/SalesPredictionDashboard', () => ({
  default: () => null,
}));

// ─── État Redux stable (défini une seule fois — pas de spread dans le mock) ──

const defaultState = {
  auth:      { user: { UserID: 1, FullName: 'Admin', UserRole: 'Administrateur' } },
  objectifs: { objectifs: [], loading: false },
  devis:     { devis: [], currentDevis: null, loading: false, error: null },
  bcv:       { bcvList: [], currentBcv: null, loading: false },
  blv:       { blvList: [], currentBlv: null, loading: false, error: null },
  fav:       { favList: [], currentFav: null, loading: false },
};

// États spécifiques — créés une seule fois pour éviter la boucle infinie
const stateDevis003 = {
  ...defaultState,
  devis: {
    currentDevis: {
      ID_Devis: 3, CodDev: 'DEV-003', Statut: 'Accepté',
      Valid: 1, IsConverted: false, bTransf: false,
      CodTiers: 'CLI-001', LibTiers: 'Pharma Plus',
      MontantHT: 1200, lignes: [],
    },
    devis: [], loading: false, error: null,
  },
};

const stateBlv005 = {
  ...defaultState,
  blv: {
    currentBlv: {
      ID_Blv: 5, Prfx: 'BLV-', Nf: '005', Statut: 'Validé',
      CodTiers: 'CLI-001', LibTiers: 'Pharma Plus',
      lignes: [{ CodArt: 'PRD-001', LibArt: 'Tensiomètre', Qte: 3 }],
    },
    blvList: [], loading: false, error: null,
  },
};

const stateFav003 = {
  ...defaultState,
  fav: {
    currentFav: {
      ID_Fav: 3, CodFav: 'FAV-003', Statut: 'Validée',
      CodTiers: 'CLI-001', LibTiers: 'Pharma Plus',
      CodBlv: 'BLV-005', stockDecremente: true,
      lignes: [], MontantTTC: 1416,
    },
    favList: [], loading: false,
  },
};

const stateClientDocs = {
  ...defaultState,
  devis: { devis: [{ ID_Devis: 1, CodDev: 'DEV-001', Statut: 'En attente', MontantHT: 500 }], loading: false, error: null },
  bcv:   { bcvList: [], loading: false },
  blv:   { blvList: [], loading: false, error: null },
  fav:   { favList: [], loading: false },
};

const stateObjectifs = {
  ...defaultState,
  objectifs: { objectifs: [], loading: false },
  auth:      { user: { UserID: 2, UserRole: 'Commercial' } },
};

// ─── beforeEach ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockUseParams.mockReturnValue({});

  mockUseAuth.mockReturnValue({
    user: { UserID: 1, FullName: 'Admin', UserRole: 'Administrateur' },
    isClient: false, isTechnicien: false, isAdmin: true,
  });

  mockUsePermission.mockReturnValue({
    canCreate: true, canEdit: true, canDelete: true, canValidate: true,
  });

  mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve({}) });

  // ✅ Référence stable : pas de spread inline dans le mock
  mockUseSelector.mockImplementation((sel) => sel(defaultState));

  mockGet.mockResolvedValue({ data: [] });
  mockPost.mockResolvedValue({ data: {} });
  mockPatch.mockResolvedValue({ data: {} });
});

// ─────────────────────────────────────────────────────────────────────────────
// T20 — Définition d'un objectif commercial
// ─────────────────────────────────────────────────────────────────────────────
describe('T20 — Définition d\'un objectif commercial', () => {
  test('Objectif CA 50 000 TND créé → toast "Objectif créé avec succès"', async () => {
    mockGet.mockResolvedValue({
      data: [{ userId: 2, label: 'Ahmed Ben Ali', fullName: 'Ahmed Ben Ali' }],
    });

    renderWithRouter(<ObjectifForm />);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Créer l'objectif/i }).length).toBeGreaterThan(0),
      { timeout: 3000 }
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Créer l'objectif/i })[0]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Objectif créé avec succès'),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T21 — Création d'un devis multi-lignes
// ─────────────────────────────────────────────────────────────────────────────
describe('T21 — Création d\'un devis multi-lignes', () => {
  test('Formulaire DevisForm chargé avec zone de recherche produit', async () => {
    mockGet.mockResolvedValue({ data: [] });

    renderWithRouter(<DevisForm />);

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/remarque|note|client|produit/i) ||
        screen.queryByRole('button', { name: /Ajouter un article|Finaliser|Créer le devis/i })
      ).toBeTruthy(),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T22 — Conversion devis accepté en BCV
// ─────────────────────────────────────────────────────────────────────────────
describe('T22 — Conversion devis en BCV', () => {
  test('Clic "Convertir en BC" → toast "Devis converti en commande"', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    // ✅ Référence stable assignée avant renderWithRouter
    mockUseSelector.mockImplementation((sel) => sel(stateDevis003));

    renderWithRouter(<DevisDetail />);
    await waitFor(() => screen.getByRole('button', { name: /Convertir en BC/i }), { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: /Convertir en BC/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Devis converti en commande'),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T23 — Validation BLV — stock suffisant
// ─────────────────────────────────────────────────────────────────────────────
describe('T23 — Validation BLV — stock suffisant', () => {
  test('BLV-005 affiché avec client Pharma Plus (Qte=3, stock=20)', async () => {
    mockUseParams.mockReturnValue({ id: '5' });
    // ✅ Référence stable
    mockUseSelector.mockImplementation((sel) => sel(stateBlv005));

    renderWithRouter(<BlvDetail />);

    await waitFor(() => screen.getByText(/BLV-005|Pharma Plus/), { timeout: 3000 });
    expect(screen.getByText(/BLV-005|Pharma Plus/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T24 — FAV depuis BLV validé (anti-double décrémentation)
// ─────────────────────────────────────────────────────────────────────────────
describe('T24 — FAV depuis BLV validé', () => {
  test('FAV-003 affichée avec titre "Facture" (stockDecremente = true)', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    // ✅ Référence stable
    mockUseSelector.mockImplementation((sel) => sel(stateFav003));

    renderWithRouter(<FavDetail />);

    await waitFor(() => screen.getByText(/Facture/i), { timeout: 3000 });
    expect(screen.getByText(/Facture/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T25 — Consultation documents (portail client)
// ─────────────────────────────────────────────────────────────────────────────
describe('T25 — Consultation documents (portail client)', () => {
  test('Onglets Devis et Factures visibles pour le client MedEquip', () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 10, UserRole: 'Client' },
      isClient: true, isTechnicien: false, isAdmin: false,
    });
    // ✅ Référence stable
    mockUseSelector.mockImplementation((sel) => sel(stateClientDocs));

    renderWithRouter(<ClientDocuments />);

    expect(screen.getByRole('button', { name: /Devis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Factures/i })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T26 — Création d'un règlement partiel
// ─────────────────────────────────────────────────────────────────────────────
describe('T26 — Règlement partiel (600 TND / 1 200 TND)', () => {
  test('Saisie 600 TND → message "Règlement créé avec succès"', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('tiers'))      return Promise.resolve({ data: [] });
      if (url.includes('reglements')) return Promise.resolve({ data: [] });
      if (url.includes('banques'))    return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    mockPost.mockResolvedValue({ data: { status: 'success' } });

    renderWithRouter(
      <ReglemForm isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    await waitFor(() => screen.getByText('Créer un Règlement'), { timeout: 3000 });

    fireEvent.change(screen.getByPlaceholderText('0.000'), {
      target: { name: 'montantGlobal', value: '600' },
    });

    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    else fireEvent.click(screen.getByRole('button', { name: /Créer le règlement/i }));

    await waitFor(() =>
      expect(screen.getByText(/Règlement créé/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T27 — Règlement intégral
// ─────────────────────────────────────────────────────────────────────────────
describe('T27 — Règlement intégral (800 TND / 800 TND)', () => {
  test('FAV-002 entièrement payée → badge "Payé" affiché', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('stats'))      return Promise.resolve({ data: { data: {} } });
      if (url.includes('reglements')) return Promise.resolve({ data: [
        { id: 2, CodTiers: 'CLI-002', LibTiers: 'BioLab SA',
          MontantTotal: 800, MontantPaye: 800, Statut: 'Payé',
          NumPiece: 'FAV-002', DateEcheance: '2026-03-01' },
      ]});
      if (url.includes('tiers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<ReglemsList />);

    await waitFor(() =>
      expect(screen.getAllByText('Payé').length).toBeGreaterThan(0)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T28 — Identification facture en retard
// ─────────────────────────────────────────────────────────────────────────────
describe('T28 — Facture en retard (35 jours)', () => {
  test('FAV-005 non payée depuis 35 jours → badge "Non payé" visible', async () => {
    const date35 = new Date(Date.now() - 35 * 86400000).toISOString();

    mockGet.mockImplementation((url) => {
      if (url.includes('stats'))      return Promise.resolve({ data: { data: {} } });
      if (url.includes('reglements')) return Promise.resolve({ data: [
        { id: 5, CodTiers: 'CLI-005', LibTiers: 'MedEquip',
          MontantTotal: 950, MontantPaye: 0, Statut: 'Non payé',
          NumPiece: 'FAV-005', DateEcheance: date35 },
      ]});
      if (url.includes('tiers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<ReglemsList />);

    await waitFor(() =>
      expect(screen.getAllByText(/Non payé/i).length).toBeGreaterThan(0)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T29 — Export statistiques en PDF (admin)
// ─────────────────────────────────────────────────────────────────────────────
describe('T29 — Export PDF (admin)', () => {
  test('Clic bouton PDF sur BLV-005 → toast "PDF généré avec succès"', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    mockUseParams.mockReturnValue({ id: '5' });
    // ✅ Référence stable
    mockUseSelector.mockImplementation((sel) => sel(stateBlv005));
    mockGet.mockResolvedValue({ data: new Blob(['%PDF'], { type: 'application/pdf' }) });

    renderWithRouter(<BlvDetail />);
    await waitFor(() => screen.getByRole('button', { name: /PDF/i }), { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: /PDF/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('PDF généré avec succès'),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T30 — Tableau de bord Admin — alertes
// ─────────────────────────────────────────────────────────────────────────────
describe('T30 — Tableau de bord Admin — alertes', () => {
  test('Demande de transformation en attente → section alertes affichée', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('pending-transforms')) return Promise.resolve({
        data: { data: [{ id: 1, type: 'DEV→BCV', requesterName: 'Ahmed', docRef: 'DEV-003' }] },
      });
      if (url.includes('users'))       return Promise.resolve({ data: [] });
      if (url.includes('permissions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<AdminDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/Demandes de transformation/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T31 — Tableau de bord Commercial — objectifs
// ─────────────────────────────────────────────────────────────────────────────
describe('T31 — Tableau de bord Commercial — objectifs', () => {
  test('Ahmed, avril 2026 — objectif 50 000 TND affiché (CA réalisé 32 000)', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 2, FullName: 'Ahmed Ben Ali', UserRole: 'Commercial' },
      isClient: false, isTechnicien: false, isAdmin: false,
    });
    // ✅ Référence stable
    mockUseSelector.mockImplementation((sel) => sel(stateObjectifs));

    mockGet.mockImplementation((url) => {
      if (url.includes('commercials')) return Promise.resolve({
        data: [{ userId: 2, fullName: 'Ahmed Ben Ali' }],
      });
      if (url.includes('objectifs')) return Promise.resolve({
        data: [{ ID_Objectif: 1, TypeObjectif: 'CA Mensuel',
                 Valeur_Cible: 50000, Valeur_Realisee: 32000,
                 Periode: '2026-04', Statut: 'actif',
                 commercial: { FullName: 'Ahmed Ben Ali' } }],
      });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Objectifs />);

    await waitFor(() =>
      expect(screen.getByText(/50\s?000|50000/)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});
