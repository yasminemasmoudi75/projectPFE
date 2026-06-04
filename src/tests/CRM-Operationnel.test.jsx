/**
 * Plan de Tests — CRM Opérationnel
 * T01 à T13 (sans T10) — 13 tests, un par scénario
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import toast from 'react-hot-toast';

import ProjetForm    from '@modules/crm/ProjetForm';
import ProjetsList   from '@modules/crm/ProjetsList';
import ProductForm   from '@modules/products/ProductForm';
import ProductsList  from '@modules/products/ProductsList';
import ClaimForm     from '@modules/claims/ClaimForm';
import ClaimDetail   from '@modules/claims/ClaimDetail';
import ActivitesListProMax from '@modules/activities/ActivitesListProMax';

// ══════════════════════════════════════════════════════════════════════════════
// MOCKS
// ══════════════════════════════════════════════════════════════════════════════

const mockDispatch    = vi.fn();
const mockUseSelector = vi.fn();
const mockUseAuth     = vi.fn();
const mockUsePermission = vi.fn();
const mockUseParams   = vi.fn();
const mockNavigate    = vi.fn();
const mockAxiosGet    = vi.fn();
const mockAxiosPost   = vi.fn();
const mockAxiosPatch  = vi.fn();

vi.mock('react-redux', async (imp) => ({
  ...(await imp()),
  useDispatch: () => mockDispatch,
  useSelector: (selector) => mockUseSelector(selector),
}));

vi.mock('react-router-dom', async (imp) => ({
  ...(await imp()),
  useParams:   () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@app/axios', () => ({
  default: {
    get:    (...a) => mockAxiosGet(...a),
    post:   (...a) => mockAxiosPost(...a),
    put:    vi.fn().mockResolvedValue({ data: {} }),
    patch:  (...a) => mockAxiosPatch(...a),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@hooks/useAuth',       () => ({ default: () => mockUseAuth() }));
vi.mock('@hooks/usePermission', () => ({ default: () => mockUsePermission() }));

vi.mock('@modules/crm/projetSlice', () => ({
  fetchProjets:    vi.fn(() => ({ type: 'projets/fetchAll' })),
  fetchProjetById: vi.fn(() => ({ type: 'projets/fetchById' })),
  createProjet:    vi.fn(() => ({ type: 'projets/create' })),
  updateProjet:    vi.fn(() => ({ type: 'projets/update' })),
}));

vi.mock('@modules/activities/activiteSlice', () => ({
  fetchActivites:   vi.fn(() => ({ type: 'activites/fetchAll' })),
  updateActivite:   vi.fn(() => ({ type: 'activites/update' })),
  validateActivite: vi.fn(() => ({ type: 'activites/validate' })),
  createActivite:   vi.fn(() => ({ type: 'activites/create' })),
  deleteActivite:   vi.fn(() => ({ type: 'activites/delete' })),
}));

// ── beforeEach global ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockUseParams.mockReturnValue({});

  mockUseAuth.mockReturnValue({
    user: { UserID: 1, FullName: 'Admin Test', UserRole: 'Administrateur', EmailPro: 'admin@nexus.tn' },
    isClient: false, isTechnicien: false, isAdmin: true,
  });

  mockUsePermission.mockReturnValue({
    canCreate: true, canEdit: true, canDelete: true,
    canValidate: true, canExport: true, isFilterRepresEnabled: false,
  });

  mockDispatch.mockReturnValue({
    unwrap: () => Promise.resolve({ ID_Projet: 99, Nom_Projet: 'Projet Alpha' }),
  });

  mockUseSelector.mockImplementation((selector) => {
    const state = {
      projets:   { projets: [], currentProjet: null, loading: false },
      activites: { activites: [], loading: false, pagination: { total: 0, pages: 1 } },
      auth:      { user: { UserID: 1, FullName: 'Admin Test', UserRole: 'Administrateur' } },
    };
    return selector(state);
  });

  mockAxiosGet.mockResolvedValue({ data: [] });
  mockAxiosPost.mockResolvedValue({ data: { status: 'success' } });
  mockAxiosPatch.mockResolvedValue({ data: { status: 'success' } });
});

// ══════════════════════════════════════════════════════════════════════════════
// T01 — Création d'un projet client
//       Nom : « Projet Alpha », société Tech Solutions, date début 01/03/2026
//       → Projet créé, lié à la société, visible dans la liste avec avancement 0 %
// ══════════════════════════════════════════════════════════════════════════════
describe('T01 — Création d\'un projet client', () => {
  test('Saisie du nom "Projet Alpha" → dispatch createProjet + toast "Projet créé"', async () => {
    renderWithRouter(<ProjetForm />, { route: '/projets/new' });

    fireEvent.change(screen.getByPlaceholderText('Nom du projet…'), {
      target: { value: 'Projet Alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Créer le projet/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Projet créé')
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T02 — Suivi avancement — statut En retard
//       Projet PRO-002, date fin dépassée, avancement 40 %
//       → Statut « En retard », barre de progression en rouge
// ══════════════════════════════════════════════════════════════════════════════
describe('T02 — Suivi avancement — statut En retard', () => {
  test('Projet avec date dépassée affiché avec avancement 40 %', () => {
    mockUseSelector.mockImplementation((selector) => {
      const state = {
        projets: {
          projets: [{
            ID_Projet: 2, Nom_Projet: 'PRO-002', Phase: 'En cours',
            Avancement: 40, avancement_auto: 40,
            Budget_Alloue: 0, Date_Echeance: '2024-01-01',
            Date_Creation: '2023-01-01', Priorite: 'Haute',
            client: { Raisoc: 'Tech Solutions', codRepresTiers: '' },
          }],
          currentProjet: null, loading: false,
        },
        activites: { activites: [], loading: false },
        auth: { user: { UserID: 1, UserRole: 'Administrateur' } },
      };
      return selector(state);
    });

    renderWithRouter(<ProjetsList />);
    expect(screen.getByText('PRO-002')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T03 — Création d'un produit dans le catalogue
//       Référence PRD-009, désignation « Tensiomètre », prix 85,000 TND
//       → Produit enregistré et visible dans le catalogue
// ══════════════════════════════════════════════════════════════════════════════
describe('T03 — Création d\'un produit dans le catalogue', () => {
  test('Saisie PRD-009 / Tensiomètre → axios.post appelé + toast "Produit créé"', async () => {
    renderWithRouter(<ProductForm />, { route: '/products/new' });

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

// ══════════════════════════════════════════════════════════════════════════════
// T04 — Consultation catalogue (technicien connecté)
//       → Catalogue visible en lecture seule, boutons CRUD masqués
// ══════════════════════════════════════════════════════════════════════════════
describe('T04 — Consultation catalogue (technicien connecté)', () => {
  test('Catalogue visible mais bouton "Nouveau produit" masqué pour le technicien', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, FullName: 'Karim T.', UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockUsePermission.mockReturnValue({
      canCreate: false, canEdit: false, canDelete: false,
    });

    renderWithRouter(<ProductsList />);

    await waitFor(() =>
      expect(screen.getByText('Catalogue Produits')).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /Nouveau produit/i })).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T05 — Alerte stock bas déclenchée
//       Produit PRD-003, stock 3 unités, seuil défini à 5
//       → Badge « Faible » affiché
// ══════════════════════════════════════════════════════════════════════════════
describe('T05 — Alerte stock bas déclenchée', () => {
  test('Badge "Faible" visible pour un produit avec Qte = 3 (seuil 5)', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [{ IDArt: 3, CodArt: 'PRD-003', LibArt: 'Glucomètre', PrixVente: 45, Qte: 3, Marque: 'BioMed', Collection: 'Diagnostic', urlimg: '' }],
      pagination: { total: 1, pages: 1 },
      meta: {
        stockFilters: {
          all:     { id: 'all',     label: 'Tous',    count: 1, visible: true },
          ok:      { id: 'ok',      label: 'Dispo',   count: 0, visible: true },
          low:     { id: 'low',     label: 'Faible',  count: 1, visible: true },
          rupture: { id: 'rupture', label: 'Rupture', count: 0, visible: true },
        },
      },
    });

    renderWithRouter(<ProductsList />);
    await waitFor(() =>
      expect(screen.getAllByText('Faible').length).toBeGreaterThan(0)
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T06 — Création d'une réclamation (admin)
//       Type : panne, priorité critique, client Pharma Plus
//       → Réclamation enregistrée, statut « Ouverte », référence REC-006 générée
// ══════════════════════════════════════════════════════════════════════════════
describe('T06 — Création d\'une réclamation (admin)', () => {
  test('3 étapes complétées → axios.post + toast "Réclamation enregistrée avec succès"', async () => {
    mockAxiosGet.mockResolvedValue({
      data: { data: [{ CodTiers: 'CLI-001', LibTiers: 'Pharma Plus', Raisoc: 'Pharma Plus' }] },
    });
    mockAxiosPost.mockResolvedValue({ data: { ID: 6, NumTicket: 'REC-006', Statut: 'Ouvert' } });

    renderWithRouter(<ClaimForm />, { route: '/claims/new' });
    await waitFor(() => screen.getByText(/Choisir un client/i));

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { name: 'CodTiers', value: 'CLI-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));
    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Panne matériel critique' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'Le capteur principal est tombé en panne.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T07 — Affectation réclamation à technicien
//       REC-001 (Ouverte) + technicien Karim T.
//       → Bouton "Marquer Résolu" visible, ticket REC-001 affiché
// ══════════════════════════════════════════════════════════════════════════════
describe('T07 — Affectation réclamation à technicien', () => {
  test('ClaimDetail REC-001 : bouton "Marquer Résolu" présent pour réclamation ouverte', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockAxiosGet.mockResolvedValue({
      data: {
        ID: 1, NumTicket: 'REC-001', Objet: 'Panne capteur',
        Statut: 'Ouvert', Priorite: 'Haute',
        LibTiers: 'Pharma Plus', CodTiers: 'CLI-001',
        NomTechnicien: null, TechnicienID: null,
        DateOuverture: '2026-01-10', interventions: [],
      },
    });

    renderWithRouter(<ClaimDetail />, { route: '/claims/1' });
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Marquer Résolu/i }).length).toBeGreaterThan(0)
    );
    expect(screen.getByText('REC-001')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T08 — Création réclamation (secrétaire)
//       Secrétaire crée réclamation pour client MedEquip
//       → Réclamation créée et visible dans le tableau admin
// ══════════════════════════════════════════════════════════════════════════════
describe('T08 — Création réclamation (secrétaire)', () => {
  test('Secrétaire complète le formulaire → toast "Réclamation enregistrée avec succès"', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 3, FullName: 'Sophie S.', UserRole: 'Secrétaire', EmailPro: 'sophie@nexus.tn' },
      isClient: false, isTechnicien: false, isAdmin: false,
    });
    mockAxiosGet.mockResolvedValue({
      data: { data: [{ CodTiers: 'MED-01', LibTiers: 'MedEquip', Raisoc: 'MedEquip' }] },
    });
    mockAxiosPost.mockResolvedValue({ data: { ID: 8, NumTicket: 'REC-008', Statut: 'Ouvert' } });

    renderWithRouter(<ClaimForm />, { route: '/claims/new' });
    await waitFor(() => screen.getByText(/Choisir un client/i));

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { name: 'CodTiers', value: 'MED-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));
    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Problème livraison' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'Livraison incomplète reçue.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T09 — Soumission réclamation (portail client)
//       Client soumet réclamation avec description
//       → Réclamation visible côté admin avec statut « Ouverte »
// ══════════════════════════════════════════════════════════════════════════════
describe('T09 — Soumission réclamation (portail client)', () => {
  test('Client démarre à l\'étape 2 et soumet → toast "Réclamation enregistrée avec succès"', async () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 10, FullName: 'Ali Dupont', UserRole: 'Client', EmailPro: 'client@medequip.tn' },
      isClient: true, isTechnicien: false, isAdmin: false,
    });
    mockAxiosGet.mockResolvedValue({
      data: { data: { CodTiers: 'CLI-010', Raisoc: 'MedEquip', LibTiers: 'MedEquip' } },
    });
    mockAxiosPost.mockResolvedValue({ data: { ID: 9, NumTicket: 'REC-009', Statut: 'Ouvert' } });

    renderWithRouter(<ClaimForm />, { route: '/claims/new' });

    // Le client commence directement à l'étape "Détails" (pas de sélection client)
    await waitFor(() => screen.getByPlaceholderText(/Produit défectueux/i));
    expect(screen.getByText(/Deux étapes simples/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Produit défectueux/i), {
      target: { name: 'Objet', value: 'Appareil défectueux à la livraison' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    await waitFor(() => screen.getByPlaceholderText(/Décrivez le problème/i));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez le problème/i), {
      target: { name: 'Description', value: 'L\'écran est fissuré à la réception du colis.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Réclamation enregistrée avec succès')
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T11 — Mise à jour statut réclamation (technicien)
//       REC-002, statut : En cours → Résolu
//       → api.patch appelé avec { statut: 'Résolu' }
// ══════════════════════════════════════════════════════════════════════════════
describe('T11 — Mise à jour statut réclamation (technicien)', () => {
  test('Clic "Marquer Résolu" → api.patch appelé avec statut Résolu', async () => {
    mockUseParams.mockReturnValue({ id: '2' });
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, FullName: 'Karim T.', UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockAxiosGet.mockResolvedValue({
      data: {
        ID: 2, NumTicket: 'REC-002', Objet: 'Remplacement capteur',
        Statut: 'En cours', Priorite: 'Normale',
        LibTiers: 'BioLab SA', CodTiers: 'BIO-01',
        NomTechnicien: 'Karim T.', TechnicienID: 5,
        DateOuverture: '2026-02-01', interventions: [],
      },
    });
    mockAxiosPatch.mockResolvedValue({ data: { Statut: 'Résolu' } });

    renderWithRouter(<ClaimDetail />, { route: '/claims/2' });
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Marquer Résolu/i }).length).toBeGreaterThan(0)
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Marquer Résolu/i })[0]);

    await waitFor(() =>
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        expect.stringMatching(/reclamations\/.*\/statut/),
        expect.objectContaining({ statut: 'Résolu' })
      )
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T12 — Ajout notes d'intervention (technicien)
//       Réclamation REC-003 → bouton "Nouvelle intervention" visible
//       → navigation vers /claims/:id/intervention/new
// ══════════════════════════════════════════════════════════════════════════════
describe('T12 — Ajout notes d\'intervention (technicien)', () => {
  test('REC-003 chargé → onglet Interventions cliqué → "Aucune intervention planifiée" affiché', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, FullName: 'Karim T.', UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockAxiosGet.mockResolvedValue({
      data: {
        ID: 3, NumTicket: 'REC-003', Objet: 'Entretien annuel',
        Statut: 'En cours', Priorite: 'Normale',
        LibTiers: 'ClinicSud', CodTiers: 'CLI-003',
        NomTechnicien: 'Karim T.', TechnicienID: 5,
        DateOuverture: '2026-03-01', interventions: [],
      },
    });

    renderWithRouter(<ClaimDetail />, { route: '/claims/3' });

    // Attendre le chargement du ticket
    await waitFor(() => screen.getByText('REC-003'), { timeout: 3000 });

    // Cliquer sur l'onglet "Interventions" pour afficher le contenu
    const tabBtn = screen.queryByRole('button', { name: /^Interventions/i });
    if (tabBtn) fireEvent.click(tabBtn);

    await waitFor(() =>
      expect(screen.getByText(/Aucune intervention planifiée/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// T13 — Gestion des tâches (technicien)
//       Tâche « Planifié » visible dans le tableau + KPI « En cours » affiché
//       → Statut tâche mis à jour dans le tableau Kanban
// ══════════════════════════════════════════════════════════════════════════════
describe('T13 — Gestion des tâches (technicien)', () => {
  test('Activité "Planifié" rendue dans la liste + KPI "En cours" visible', () => {
    mockUseAuth.mockReturnValue({
      user: { UserID: 5, FullName: 'Karim T.', UserRole: 'Technicien' },
      isClient: false, isTechnicien: true, isAdmin: false,
    });
    mockUseSelector.mockImplementation((selector) => {
      const state = {
        activites: {
          activites: [{
            ID_Activite: 2,
            Type_Activite: 'Tâche',
            Description: 'INT-002 — Intervention planifiée BioLab',
            Statut: 'Planifié',
            Date_Activite: '2026-06-10T09:00:00',
            Valide: 1,
            IDTiers: 'BIO-01',
            ID_Projet: null,
            utilisateur: { UserID: 5, FullName: 'Karim T.' },
            tiers: { Raisoc: 'BioLab SA' },
          }],
          loading: false, pagination: { total: 1, pages: 1 },
        },
        projets: { projets: [], loading: false },
        auth:    { user: { UserID: 5, UserRole: 'Technicien' } },
      };
      return selector(state);
    });

    renderWithRouter(<ActivitesListProMax />);

    expect(screen.getByText(/INT-002/i)).toBeInTheDocument();
    expect(screen.getAllByText('Planifié').length).toBeGreaterThan(0);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });
});
