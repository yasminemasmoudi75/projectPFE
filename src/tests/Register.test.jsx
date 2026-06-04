/**
 * Tests — Formulaire d'inscription (Register)
 * Composant : src/auth/Register.jsx
 */
import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import Register from '@auth/Register';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@auth/authService', () => ({
  default: {
    register: vi.fn().mockResolvedValue({ data: { status: 'success' } }),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
const setup = () => renderWithRouter(<Register />);

const getNameInput      = () => screen.getByPlaceholderText('Prénom Nom');
const getEmailInput     = () => screen.getByPlaceholderText('votre.email@bs.tn');
const getPasswordInputs = () => screen.getAllByPlaceholderText('••••••••');
const getSubmitBtn      = () => screen.getByRole('button', { name: /Créer mon compte/i });

// ─── Suite 1 : Rendu initial ───────────────────────────────────────────────
describe('Register — Rendu initial', () => {

  test('T-REG01 — Affiche le titre "Créer un Accès Personnalisé"', () => {
    setup();
    expect(screen.getByText('Créer un')).toBeInTheDocument();
    expect(screen.getByText('Accès Personnalisé')).toBeInTheDocument();
  });

  test('T-REG02 — Quatre champs présents (nom, email, mdp, confirmation)', () => {
    setup();
    expect(getNameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInputs().length).toBe(2);
  });

  test('T-REG03 — Bouton "Créer mon compte" présent', () => {
    setup();
    expect(getSubmitBtn()).toBeInTheDocument();
  });

  test('T-REG04 — Lien vers la connexion ("Ouvrir une session") présent', () => {
    setup();
    expect(screen.getByText(/Ouvrir une session/i)).toBeInTheDocument();
  });

  test('T-REG05 — Message de validation admin affiché', () => {
    setup();
    expect(screen.getByText(/administrateur avant activation/i)).toBeInTheDocument();
  });

});

// ─── Suite 2 : Validation Zod ──────────────────────────────────────────────
describe('Register — Validation du formulaire', () => {

  test('T-REG06 — Nom trop court (<3 caractères) → message d\'erreur', async () => {
    setup();
    fireEvent.change(getNameInput(), { target: { value: 'Al' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText(/au moins 3 caractères/i)).toBeInTheDocument();
    });
  });

  test('T-REG07 — Email invalide → message d\'erreur format', async () => {
    const { container } = setup();
    fireEvent.change(getNameInput(),  { target: { value: 'Ahmed Ben Ali' } });
    fireEvent.change(getEmailInput(), { target: { value: 'emailinvalide' } });
    // Bypass la validation HTML5 native de type="email" en soumettant le form
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => {
      expect(screen.getByText(/Email invalide/i)).toBeInTheDocument();
    });
  });

  test('T-REG08 — Mot de passe trop court (<6 caractères) → message d\'erreur', async () => {
    setup();
    fireEvent.change(getNameInput(),  { target: { value: 'Ahmed Ben Ali' } });
    fireEvent.change(getEmailInput(), { target: { value: 'ahmed@nexus.tn' } });
    fireEvent.change(getPasswordInputs()[0], { target: { value: '123' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText(/au moins 6 caractères/i)).toBeInTheDocument();
    });
  });

  test('T-REG09 — Mots de passe différents → erreur de correspondance', async () => {
    setup();
    fireEvent.change(getNameInput(),  { target: { value: 'Ahmed Ben Ali' } });
    fireEvent.change(getEmailInput(), { target: { value: 'ahmed@nexus.tn' } });
    const [pwd, confirm] = getPasswordInputs();
    fireEvent.change(pwd,     { target: { value: 'Aa123456?' } });
    fireEvent.change(confirm, { target: { value: 'Different1!' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
    });
  });

  test('T-REG10 — Formulaire valide → aucune erreur de validation', async () => {
    setup();
    fireEvent.change(getNameInput(),  { target: { value: 'Ahmed Ben Ali' } });
    fireEvent.change(getEmailInput(), { target: { value: 'ahmed@nexus.tn' } });
    const [pwd, confirm] = getPasswordInputs();
    fireEvent.change(pwd,     { target: { value: 'Aa123456?' } });
    fireEvent.change(confirm, { target: { value: 'Aa123456?' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.queryByText(/au moins|invalide|correspondent/i)).toBeNull();
    });
  });

});

// ─── Suite 3 : Interactions ────────────────────────────────────────────────
describe('Register — Interactions', () => {

  test('T-REG11 — Saisie dans le champ nom mise à jour', () => {
    setup();
    const input = getNameInput();
    fireEvent.change(input, { target: { value: 'Sarah Masmoudi' } });
    expect(input.value).toBe('Sarah Masmoudi');
  });

  test('T-REG12 — Saisie dans le champ email mise à jour', () => {
    setup();
    const input = getEmailInput();
    fireEvent.change(input, { target: { value: 'sarah@nexus.tn' } });
    expect(input.value).toBe('sarah@nexus.tn');
  });

  test('T-REG13 — Bascule visibilité mot de passe', () => {
    setup();
    const [pwdInput] = getPasswordInputs();
    expect(pwdInput.type).toBe('password');
    const toggleBtn = screen.getAllByRole('button').find(b => b.type === 'button' && b !== getSubmitBtn());
    fireEvent.click(toggleBtn);
    expect(getPasswordInputs()[0].type).toBe('text');
  });

});
