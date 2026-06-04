/**
 * Tests — StatCard
 * Composant : src/components/ui/StatCard.jsx
 * Aucun provider requis (composant pur).
 */
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import StatCard from '@components/ui/StatCard';

const defaultProps = {
  title: 'Clients actifs',
  value: '142',
  icon: UsersIcon,
  color: 'brand',
};

// ─── Suite 1 : Affichage de base ───────────────────────────────────────────
describe('StatCard — Affichage de base', () => {

  test('T-SC01 — Affiche le titre et la valeur', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('Clients actifs')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
  });

  test('T-SC02 — Affiche le sous-titre quand fourni', () => {
    render(<StatCard {...defaultProps} subtitle="Ce mois-ci" />);
    expect(screen.getByText('Ce mois-ci')).toBeInTheDocument();
  });

  test('T-SC03 — N\'affiche pas de sous-titre si absent', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.queryByText('Ce mois-ci')).toBeNull();
  });

  test('T-SC04 — Rend l\'icône SVG', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

});

// ─── Suite 2 : Indicateur de tendance ─────────────────────────────────────
describe('StatCard — Tendance', () => {

  test('T-SC05 — Affiche +12% pour une tendance positive', () => {
    render(<StatCard {...defaultProps} trend={12} trendValue="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  test('T-SC06 — Affiche -5% pour une tendance négative', () => {
    render(<StatCard {...defaultProps} trend={-5} trendValue="-5%" />);
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  test('T-SC07 — Pas d\'indicateur de tendance si trend est null', () => {
    render(<StatCard {...defaultProps} trend={null} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

});

// ─── Suite 3 : Barre de progression ───────────────────────────────────────
describe('StatCard — Barre de progression', () => {

  test('T-SC08 — Affiche la barre si progress est fourni', () => {
    const { container } = render(<StatCard {...defaultProps} progress={65} />);
    const bar = container.querySelector('[style*="width: 65%"]');
    expect(bar).toBeInTheDocument();
  });

  test('T-SC09 — Pas de barre si progress est null', () => {
    const { container } = render(<StatCard {...defaultProps} progress={null} />);
    expect(container.querySelector('[style*="width"]')).toBeNull();
  });

  test('T-SC10 — Barre limitée à 100% même si progress > 100', () => {
    const { container } = render(<StatCard {...defaultProps} progress={150} />);
    const bar = container.querySelector('[style*="width: 100%"]');
    expect(bar).toBeInTheDocument();
  });

  test('T-SC11 — Barre à 0% si progress = 0', () => {
    const { container } = render(<StatCard {...defaultProps} progress={0} />);
    const bar = container.querySelector('[style*="width: 0%"]');
    expect(bar).toBeInTheDocument();
  });

});

// ─── Suite 4 : Interaction ─────────────────────────────────────────────────
describe('StatCard — Interaction', () => {

  test('T-SC12 — onClick déclenché au clic', () => {
    const handleClick = vi.fn();
    render(<StatCard {...defaultProps} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Clients actifs').closest('div[class*="rounded"]'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('T-SC13 — Pas de curseur pointer si onClick absent', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    const card = container.firstChild;
    expect(card.className).not.toContain('cursor-pointer');
  });

});
