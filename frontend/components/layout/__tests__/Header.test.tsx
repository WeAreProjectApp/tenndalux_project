import { fireEvent, render, screen } from '@testing-library/react';
import Header from '../Header';

jest.mock('next/navigation', () => ({ usePathname: () => '/servicios' }));
jest.mock('gsap', () => ({
  timeline: (options?: { onComplete?: () => void }) => {
    const timeline = {
      set: (target: HTMLElement, values: { display: string }) => { target.style.display = values.display; return timeline; },
      fromTo: () => timeline,
      to: () => { options?.onComplete?.(); return timeline; },
      kill: jest.fn(),
    };
    return timeline;
  },
  set: (target: HTMLElement, values: { display: string }) => { target.style.display = values.display; },
}));

beforeEach(() => {
  document.body.style.overflow = '';
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

function openMenu() {
  render(<Header />);
  const trigger = screen.getByRole('button', { name: 'Toggle menu' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

// Catches the menu remaining in the accessibility tree after dismissal.
it('closes the navigation with Escape', () => {
  const trigger = openMenu();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(trigger).toHaveFocus();
});

it('closes the navigation from its close button', () => {
  const trigger = openMenu();
  fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('closes the navigation from its empty background', () => {
  const trigger = openMenu();
  fireEvent.click(screen.getByRole('dialog'));
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('wraps keyboard focus inside the navigation', () => {
  openMenu();
  const facebook = screen.getByRole('link', { name: 'Facebook' });
  facebook.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(screen.getByTestId('mobile-menu-logo-link')).toHaveFocus();
});

it('preserves the preceding scroll state', () => {
  document.body.style.overflow = 'clip';
  const trigger = openMenu();
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.body.style.overflow).toBe('clip');
  expect(trigger).toHaveFocus();
});
