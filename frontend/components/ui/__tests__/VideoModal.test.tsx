import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VideoModal from '../VideoModal';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
    this.querySelector<HTMLButtonElement>('button')?.focus();
  };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

afterEach(() => { document.body.style.overflow = ''; });

// Catches an unnamed dialog, offscreen close controls or incorrect media selection.
it('opens the named video player', () => {
  render(<VideoModal isOpen onClose={jest.fn()} videoSrc="/videos/proyecto.webm" title="Proyecto cortinas" />);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Proyecto cortinas');
  expect(screen.getByRole('button', { name: 'Cerrar video' })).toHaveFocus();
  expect(screen.getByTestId('video-webm-source')).toHaveAttribute('src', '/videos/proyecto.webm');
});

it('closes from the close control', () => {
  const onClose = jest.fn();
  render(<VideoModal isOpen onClose={onClose} videoSrc="/videos/proyecto.webm" />);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar video' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('closes from native cancellation', () => {
  const onClose = jest.fn();
  render(<VideoModal isOpen onClose={onClose} videoSrc="/videos/proyecto.webm" />);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('closes from the empty background', () => {
  const onClose = jest.fn();
  render(<VideoModal isOpen onClose={onClose} videoSrc="/videos/proyecto.webm" />);
  fireEvent.click(screen.getByRole('dialog'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('keeps the player open when its title is clicked', () => {
  const onClose = jest.fn();
  render(<VideoModal isOpen onClose={onClose} videoSrc="/videos/proyecto.webm" title="Proyecto cortinas" />);
  fireEvent.click(screen.getByRole('heading', { name: 'Proyecto cortinas' }));
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toHaveTextContent('Proyecto cortinas');
});

// Catches cleanup overwriting a previous scroll lock or losing the opener.
it('restores the opener after closing', () => {
  const { rerender } = render(<><button>Ver proyecto</button><VideoModal isOpen={false} onClose={jest.fn()} videoSrc="/videos/proyecto.webm" /></>);
  const opener = screen.getByRole('button', { name: 'Ver proyecto' });
  opener.focus();
  document.body.style.overflow = 'clip';
  rerender(<><button>Ver proyecto</button><VideoModal isOpen onClose={jest.fn()} videoSrc="/videos/proyecto.webm" /></>);
  expect(document.body.style.overflow).toBe('hidden');
  rerender(<><button>Ver proyecto</button><VideoModal isOpen={false} onClose={jest.fn()} videoSrc="/videos/proyecto.webm" /></>);
  expect(document.body.style.overflow).toBe('clip');
  expect(screen.getByRole('button', { name: 'Ver proyecto' })).toHaveFocus();
});

it('restores the explicit opener when the pointer did not focus it', () => {
  const opener = createRef<HTMLButtonElement>();
  const { rerender } = render(<><button ref={opener}>Ver proyecto</button><VideoModal isOpen={false} onClose={jest.fn()} videoSrc="/videos/proyecto.webm" returnFocusRef={opener} /></>);
  rerender(<><button ref={opener}>Ver proyecto</button><VideoModal isOpen onClose={jest.fn()} videoSrc="/videos/proyecto.webm" returnFocusRef={opener} /></>);
  rerender(<><button ref={opener}>Ver proyecto</button><VideoModal isOpen={false} onClose={jest.fn()} videoSrc="/videos/proyecto.webm" returnFocusRef={opener} /></>);
  expect(screen.getByRole('button', { name: 'Ver proyecto' })).toHaveFocus();
});

it('wraps backward focus from the close control to the player', () => {
  render(<VideoModal isOpen onClose={jest.fn()} videoSrc="/videos/proyecto.webm" />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Cerrar video' }), { key: 'Tab', shiftKey: true });
  expect(screen.getByLabelText('Video Tenndalux', { selector: 'video' })).toHaveFocus();
});
