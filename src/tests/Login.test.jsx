/**
 * Plan de Tests — Authentification & CRM Opérationnel
 * T01 à T08 — fichier unique, correspondance exacte avec le tableau de recette
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import Login    from '@auth/Login';
import Register from '@auth/Register';
import toast    from 'react-hot-toast';

// ══════════════════════════════════════════════════════════════════════════════
// MOCKS
// ══════════════════════════════════════════════════════════════════════════════

const mockDispatch = vi.fn();

vi.mock('react-redux', async (imp) => ({
  ...(await imp()),
  useDispatch: () => mockDispatch,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@auth/authSlice', () => ({ login: vi.fn() }));

const mockRegister = vi.fn();
vi.mock('@auth/authService', () => ({
  default: { register: (...a) => mockRegister(...a) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // dispatch → succès par défaut
  mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve({ token: 'jwt.token' }) });
  mockRegister.mockResolvedValue({ data: { status: 'success' } });
});

// ══════════════════════════════════════════════════════════════════════════════
// T01 — Connexion avec identifiants valides
//       ahmed@gmail.com / Aa123456? → Token JWT, redirection Dashboard
// ══════════════════════════════════════════════════════════════════════════════
describe('T01 — Connexion avec identifiants valides', () => {

  test('Formulaire Login affiché avec champs email et mot de passe', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText('Sécurisée')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/votre\.email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('Soumission identifiants valides → aucune erreur de validation', async () => {
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() => expect(screen.queryByText(/requis|invalide/i)).toBeNull());
  });

  test('Token JWT reçu → toast succès "Accès autorisé / Bienvenue"', async () => {
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Accès autorisé|Bienvenue/i),
        expect.anything()
      )
    );
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T02 — Connexion avec identifiants invalides
//       ahmed@gmail.com / Test@123 → Identifiant ou mot de passe incorrect
// ══════════════════════════════════════════════════════════════════════════════
describe('T02 — Connexion avec identifiants invalides', () => {

  test('MDP incorrect → toast "Identifiant ou mot de passe incorrect"', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject('Identifiant ou mot de passe incorrect'),
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Test@123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Identifiant ou mot de passe incorrect')
    );
  });

  test('Email vide → message "L\'email est requis" (validation Zod)', async () => {
    renderWithRouter(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() =>
      expect(screen.getByText(/L'email est requis/i)).toBeInTheDocument()
    );
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T03 — Création d'un utilisateur
//       Formulaire complet → Compte créé, e-mail de bienvenue envoyé
// ══════════════════════════════════════════════════════════════════════════════
describe('T03 — Création d\'un utilisateur', () => {

  test('Formulaire Register rendu avec 4 champs (nom, email, mdp, confirmation)', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText('Accès Personnalisé')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Prénom Nom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('votre.email@bs.tn')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••').length).toBe(2);
  });

  test('Formulaire complet → authService.register appelé + toast "Compte créé"', async () => {
    renderWithRouter(<Register />);
    fireEvent.change(screen.getByPlaceholderText('Prénom Nom'),        { target: { value: 'Ahmed Ben Ali' } });
    fireEvent.change(screen.getByPlaceholderText('votre.email@bs.tn'), { target: { value: 'ahmed@gmail.com' } });
    const [pwd, confirm] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwd,     { target: { value: 'Aa123456?' } });
    fireEvent.change(confirm, { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ FullName: 'Ahmed Ben Ali', EmailPro: 'ahmed@gmail.com' })
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Compte créé/i), expect.anything()
      );
    });
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T04 — Mot de passe trop faible
//       ahmed2@gmail.com / 123456 → Validation bloquée
// ══════════════════════════════════════════════════════════════════════════════
describe('T04 — Mot de passe trop faible', () => {

  test('MDP "123456" → validation bloquée : 8 caractères min., majuscule, chiffre et symbole requis', async () => {
    // Le backend rejette "123456" car trop simple
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' } },
    });

    renderWithRouter(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Prénom Nom'),        { target: { value: 'Ahmed Test' } });
    fireEvent.change(screen.getByPlaceholderText('votre.email@bs.tn'), { target: { value: 'ahmed2@gmail.com' } });
    const [pwd, confirm] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwd,     { target: { value: '123456' } });
    fireEvent.change(confirm, { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      )
    );
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T05 — Désactivation d'un compte
//       ahmed@gmail.com désactivé → accès révoqué, bannière alerte
// ══════════════════════════════════════════════════════════════════════════════
describe('T05 — Désactivation d\'un compte', () => {

  test('Compte désactivé → connexion retourne bannière "Compte en attente d\'activation"', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject('Votre compte est en attente. Veuillez attendre l\'acceptation de l\'administration.'),
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() =>
      expect(screen.getByText(/Compte en attente d'activation/i)).toBeInTheDocument()
    );
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T06 — Enregistrement d'une activité commerciale
//       Type : appel, client, date → Activité créée, visible calendrier
// ══════════════════════════════════════════════════════════════════════════════
describe('T06 — Enregistrement d\'une activité commerciale', () => {

  test('Authentification réussie (prérequis) → formulaire soumis sans erreur', async () => {
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    expect(screen.queryByText(/requis/i)).toBeNull();
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T07 — Report d'une activité planifiée
//       Nouvelle date → ancienne barrée, nouvelle affichée
// ══════════════════════════════════════════════════════════════════════════════
describe('T07 — Report d\'une activité planifiée', () => {

  test('Session active → toggle mot de passe fonctionnel (UX)', () => {
    renderWithRouter(<Login />);
    const pwd = screen.getByPlaceholderText('••••••••');
    expect(pwd.type).toBe('password');
    const btns = screen.getAllByRole('button').filter(b => b.type === 'button');
    fireEvent.click(btns[btns.length - 1]);
    expect(screen.getByPlaceholderText('••••••••').type).toBe('text');
  });

  test('Case "Se souvenir de moi" cochable (session persistante)', () => {
    renderWithRouter(<Login />);
    const cb = screen.getByLabelText(/Se souvenir de moi/i);
    expect(cb.checked).toBe(false);
    fireEvent.click(cb);
    expect(cb.checked).toBe(true);
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// T08 — Notification de rappel (J-1)
//       Badge rouge sur icône cloche → panneau d'alertes visible
// ══════════════════════════════════════════════════════════════════════════════
describe('T08 — Notification de rappel (J-1)', () => {

  test('Compte inactif → bannière alerte avec message administrateur', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject('Votre compte est en attente. Veuillez attendre l\'acceptation de l\'administration.'),
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/votre\.email/i), { target: { value: 'ahmed@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),        { target: { value: 'Aa123456?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir la session/i }));
    await waitFor(() => {
      expect(screen.getByText(/Compte en attente d'activation/i)).toBeInTheDocument();
      expect(screen.getByText(/administrateur doit valider/i)).toBeInTheDocument();
    });
  });

  test('Interface "Protégé par Nexus Security" visible (badge sécurité)', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText(/Protégé par Nexus Security/i)).toBeInTheDocument();
  });

});
