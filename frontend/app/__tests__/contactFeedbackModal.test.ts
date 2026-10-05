import { fireEvent, render, screen } from '@testing-library/react';
import { createElement, Fragment } from 'react';
import ContactFeedbackModal from '@/components/home/ContactFeedbackModal';

const modal = (status: 'success' | null) => createElement(
  Fragment,
  null,
  createElement('button', { type: 'button' }, 'Abrir contacto'),
  createElement(ContactFeedbackModal, { status, onClose: jest.fn() }),
);

describe('Contact feedback focus management', () => {
  it('moves initial focus to the close control', () => {
    // Falla si una persona que navega con teclado abre el diálogo sin un punto de partida dentro de él.
    render(createElement(ContactFeedbackModal, { status: 'success', onClose: jest.fn() }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });

  it('wraps Tab from the final control to the close control', () => {
    // Falla si Tab permite que el foco abandone el diálogo por su último control.
    render(createElement(ContactFeedbackModal, { status: 'success', onClose: jest.fn() }));
    const dismiss = screen.getByRole('button', { name: 'Volver al sitio' });
    dismiss.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });

  it('wraps Shift+Tab from the close control to the final control', () => {
    // Falla si Shift+Tab permite que el foco abandone el diálogo antes de su primer control.
    render(createElement(ContactFeedbackModal, { status: 'success', onClose: jest.fn() }));
    const close = screen.getByRole('button', { name: 'Cerrar' });
    close.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Volver al sitio' }));
  });

  it('restores focus to the prior element after the status closes', () => {
    // Falla si cerrar el diálogo deja el foco en un control que ya no está disponible.
    const { rerender } = render(modal(null));
    const trigger = screen.getByRole('button', { name: 'Abrir contacto' });
    trigger.focus();

    rerender(modal('success'));
    rerender(modal(null));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir contacto' }));
  });
});
