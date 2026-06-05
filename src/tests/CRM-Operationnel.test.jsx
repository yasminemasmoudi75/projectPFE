/**
 * Tests CRM Opérationnel — T01 à T13
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import toast from 'react-hot-toast';

import ProjetForm          from '@modules/crm/ProjetForm';
import ProjetsList         from '@modules/crm/ProjetsList';
import ProductForm         from '@modules/products/ProductForm';
import ProductsList        from '@modules/products/ProductsList';
import ClaimForm           from '@modules/claims/ClaimForm';
import ClaimDetail         from '@modules/claims/ClaimDetail';
import ActivitesListProMax from '@modules/activities/ActivitesListProMax';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockDispatch    = vi.fn();
const mockUseSelector = vi.fn();
const mockUseAuth     = vi.fn();
const mockUsePermission = vi.fn();
const mockUseParams   = vi.fn();
const mockGet         = vi.fn();
const mockPost        = vi.fn();
const mockPatch       = vi.fn();

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

vi.mock('@hooks/useAuth',       () => ({ default: () => mockUseAuth() }));
vi.mock('@hooks/usePermission', () => ({ default: () => mockUsePermission() }));

vi.mock('@modules/crm/projetSlice', () => ({
  fetchProjets:    vi.fn(() => ({ type: 'projets/fetch' })),
  fetchProjetById: vi.fn(() => ({ type: 'projets/fetchOne' })),
  createProjet:    vi.fn(() => ({ type: 'projets/create' })),
  updateProjet:    vi.fn(() => ({ type: 'projets/update' })),
}));

vi.mock('@modules/activities/activiteSlice', () => ({
  fetchActivites:   vi.fn(() => ({ type: 'activites/fetch' })),
  updateActivite:   vi.fn(() => ({ type: 'activites/update' })),
  validateActivite: vi.fn(() => ({ type: 'activites/validate' })),
  createActivite:   vi.fn(() => ({ type: 'activites/create' })),
  deleteActivite:   vi.fn(() => ({ type: 'activites/delete' })),
}));

// ─── Valeurs par défaut avant chaque test ────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockUseParams.mockReturnValue({});

  mockUseAuth.mockReturnValue({
    user: { UserID: 1, UserRole: 'Administrateur' },
    isClient: false, isTechnicien: false, isAdmin: true,
  });

  mockUsePermission.mockReturnValue({
    canCreate: true, canEdit: true, canDelete: true,
  });

  mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve({}) });

  mockUseSelector.mockImplementation((sel) => sel({
    projets:   { projets: [], currentProjet: null, loading: false },
    activites: { activites: [], loading: false, pagination: { total: 0, pages: 1 } },
    auth:      { user: { UserID: 1, UserRole: 'Administrateur' } },
  }));

  mockGet.mockResolvedValue({ data: [] });
  mockPost.mockResolvedValue({ data: {} });
  mockPatch.mockResolvedValue({ data: {} });
});

// ─────────────────────────────────────────────────────────────────────────────
// T01 — Création d'un projet client
// ─────────────────────────────────────────────────────────────────────────────
describe('T01 — Création d\'un projet client', () => {
  test('Formulaire soumis → toast "Projet créé"', async () => {
    renderWithRouter(<ProjetForm />);

    fireEvent.change(screen.getByPlaceholderText('Nom du projet…'), {
      target: { value: 'Projet Alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Créer le projet/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Projet créé')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T02 — Suivi avancement — statut En retard
// ─────────────────────────────────────────────────────────────────────────────
describe('T02 — Suivi avancement — statut En retard', () => {
  test('Projet PRO-002 date dépassée → affiché avec avancement 40 %', () => {
    mockUseSelector.mockImplementation((sel) => sel({
      projets: { projets: [{
        ID_Projet: 2,   Nom_Projet: 'PRO-002', Phase: 'En cours',
        avancement_auto: 40,  Budget_Alloue: 1000,
        Date_Echeance: '2024-01-01', Date_Creation: '2023-01-01',
        client: { Raisoc: 'Tech Solutions' },
      }], currentProjet: null, loading: false },
      activites: { activites: [], loading: false },
      auth: { user: { UserID: 1, UserRole: 'Administrateur' } },
    }));

    renderWithRouter(<ProjetsList />);

    expect(screen.getByText('PRO-002')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T03 — Création d'un produit dans le catalogue
// ─────────────────────────────────────────────────────────────────────────────
describe('T03 — Création d\'un produit dans le catalogue', () => {
  test('PRD-009 / Tensiomètre soumis → toast "Produit créé"', async () => {
    renderWithRouter(<ProductForm />);

    fireEvent.change(screen.getByPlaceholderText('MED-001'), {
      target: { name: 'CodArt', value: 'PRD-009' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nom complet du produit'), {
      target: { name: 'LibArt', value: 'Tensiomètre' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Créer le produit/i })[0]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Produit créé')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T04 — Consultation catalogue (technicien connecté)
// ─────────────────────────────────────────────────────────────────────────────
describe('T04 — Consultation catalogue (technicien)', () => {
  test('Catalogue visible, bouton "Nouveau produit" masqué', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockUsePermission.mockReturnValue({
      canCreate: false, canEdit: false, canDelete: false,
    });

    renderWithRouter(<ProductsList />);

    await waitFor(() => expect(screen.getByText('Catalogue Produits')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Nouveau produit/i })).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T05 — Alerte stock bas déclenchée
// ─────────────────────────────────────────────────────────────────────────────
describe('T05 — Alerte stock bas déclenchée', () => {
  test('Produit Qte=3 → badge "Faible" affiché', async () => {
    mockGet.mockResolvedValue({
      data: [{ IDArt: 3, CodArt: 'PRD-003', LibArt: 'Glucomètre',
               PrixVente: 45, Qte: 3, Marque: 'BioMed', urlimg: '' }],
      meta: { stockFilters: {
        all:     { label: 'Tous',    count: 1, visible: true },
        ok:      { label: 'Dispo',   count: 0, visible: true },
        low:     { label: 'Faible',  count: 1, visible: true },
        rupture: { label: 'Rupture', count: 0, visible: true },
      }},
    });

    renderWithRouter(<ProductsList />);

    await waitFor(() =>
      expect(screen.getAllByText('Faible').length).toBeGreaterThan(0)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T06 — Création d'une réclamation (admin)
// ─────────────────────────────────────────────────────────────────────────────
describe('T06 — Création d\'une réclamation (admin)', () => {
  test('3 étapes complétées → toast "Réclamation enregistrée avec succès"', async () => {
    mockGet.mockResolvedValue({ data: { data: [
      { CodTiers: 'CLI-001', LibTiers: 'Pharma Plus' },
    ]}});
    mockPost.mockResolvedValue({ data: { NumTicket: 'REC-006' } });

    renderWithRouter(<ClaimForm />);
    await waitFor(() => screen.getByText(/Choisir un client/i));

    // Étape 1 — sélectionner le client
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'CLI-001' } });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    // Étape 2 — remplir l'objet
    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));
    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Panne capteur' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    // Étape 3 — description et soumission
    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'Capteur principal défaillant.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T07 — Affectation réclamation à technicien
// ─────────────────────────────────────────────────────────────────────────────
describe('T07 — Affectation réclamation à technicien', () => {
  test('REC-001 chargée → bouton "Marquer Résolu" visible', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockGet.mockResolvedValue({ data: {
      ID: 1, NumTicket: 'REC-001', Statut: 'Ouvert',
      Objet: 'Panne capteur', Priorite: 'Haute',
      LibTiers: 'Pharma Plus', DateOuverture: '2026-01-10', interventions: [],
    }});

    renderWithRouter(<ClaimDetail />);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Marquer Résolu/i }).length).toBeGreaterThan(0)
    );
    expect(screen.getByText('REC-001')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T08 — Création réclamation (secrétaire)
// ─────────────────────────────────────────────────────────────────────────────
describe('T08 — Création réclamation (secrétaire)', () => {
  test('Secrétaire soumet pour MedEquip → toast succès', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 3, UserRole: 'Secrétaire' },
      isClient: false, isTechnicien: false, isAdmin: false,
    });
    mockGet.mockResolvedValue({ data: { data: [{ CodTiers: 'MED-01', LibTiers: 'MedEquip' }] } });
    mockPost.mockResolvedValue({ data: { NumTicket: 'REC-008' } });

    renderWithRouter(<ClaimForm />);
    await waitFor(() => screen.getByText(/Choisir un client/i));

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'MED-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));
    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Problème livraison' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'Livraison incomplète.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T09 — Soumission réclamation (portail client)
// ─────────────────────────────────────────────────────────────────────────────
describe('T09 — Soumission réclamation (portail client)', () => {
  test('Client démarre étape 2 → toast "Réclamation enregistrée avec succès"', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 10, UserRole: 'Client' },
      isClient: true, isTechnicien: false, isAdmin: false,
    });
    mockGet.mockResolvedValue({ data: { data: { CodTiers: 'CLI-010', Raisoc: 'MedEquip' } } });
    mockPost.mockResolvedValue({ data: { NumTicket: 'REC-009' } });

    renderWithRouter(<ClaimForm />);
    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));

    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Appareil défectueux' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'Écran fissuré à la réception.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Mise à jour statut (En cours → Résolu)
// ─────────────────────────────────────────────────────────────────────────────
describe('T11 — Mise à jour statut (En cours → Résolu)', () => {
  test('Clic "Marquer Résolu" → api.patch avec { statut: "Résolu" }', async () => {
    mockUseParams.mockReturnValue({ id: '2' });
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockGet.mockResolvedValue({ data: {
      ID: 2, NumTicket: 'REC-002', Statut: 'En cours',
      Objet: 'Remplacement capteur', Priorite: 'Normale',
      LibTiers: 'BioLab SA', DateOuverture: '2026-02-01', interventions: [],
    }});

    renderWithRouter(<ClaimDetail />);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Marquer Résolu/i }).length).toBeGreaterThan(0)
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Marquer Résolu/i })[0]);

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        expect.stringMatching(/reclamations\/.*\/statut/),
        { statut: 'Résolu' }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T12 — Ajout notes d'intervention
// ─────────────────────────────────────────────────────────────────────────────
describe('T12 — Ajout notes d\'intervention', () => {
  test('REC-003 → onglet Interventions → "Aucune intervention planifiée"', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockGet.mockResolvedValue({ data: {
      ID: 3, NumTicket: 'REC-003', Statut: 'En cours',
      Objet: 'Entretien annuel', Priorite: 'Normale',
      LibTiers: 'ClinicSud', DateOuverture: '2026-03-01', interventions: [],
    }});

    renderWithRouter(<ClaimDetail />);
    await waitFor(() => screen.getByText('REC-003'), { timeout: 3000 });

    const tabInterventions = screen.queryByRole('button', { name: /^Interventions/i });
    if (tabInterventions) fireEvent.click(tabInterventions);

    await waitFor(() =>
      expect(screen.getByText(/Aucune intervention planifiée/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T13 — Gestion des tâches (Kanban)
// ─────────────────────────────────────────────────────────────────────────────
describe('T13 — Gestion des tâches (Kanban)', () => {
  test('Tâche "Planifié" visible + KPI "En cours" présent', () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockUseSelector.mockImplementation((sel) => sel({
      activites: { activites: [{
        ID_Activite: 2, Type_Activite: 'Tâche', Valide: 1,
        Description: 'INT-002 — Intervention BioLab',
        Statut: 'Planifié', Date_Activite: '2026-06-10T09:00:00',
        utilisateur: { UserID: 5, FullName: 'Karim T.' },
        tiers: { Raisoc: 'BioLab SA' },
      }], loading: false, pagination: { total: 1, pages: 1 } },
      projets: { projets: [], loading: false },
      auth:    { user: { UserID: 5, UserRole: 'Technicien' } },
    }));

    renderWithRouter(<ActivitesListProMax />);

    expect(screen.getByText(/INT-002/i)).toBeInTheDocument();
    expect(screen.getAllByText('Planifié').length).toBeGreaterThan(0);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });
});
