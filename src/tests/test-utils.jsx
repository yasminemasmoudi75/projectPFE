/**
 * Utilitaires partagés pour les tests du projet front.
 * Fournit un wrapper avec MemoryRouter pour les composants qui utilisent Link/useNavigate.
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export const renderWithRouter = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

export * from '@testing-library/react';
