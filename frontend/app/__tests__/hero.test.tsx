import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Hero from '@/components/home/Hero';
import { get } from '@/lib/services/http';

jest.mock('gsap', () => {
  const timeline = { fromTo: jest.fn().mockReturnThis() };
  return {
    __esModule: true,
    default: {
      registerPlugin: jest.fn(),
      context: (callback: () => void) => {
        callback();
        return { revert: jest.fn() };
      },
      timeline: jest.fn(() => timeline),
    },
  };
});
jest.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
jest.mock('@/lib/services/http', () => ({ get: jest.fn() }));

const mockedGet = get as jest.Mock;

const renderedImageSource = (image: HTMLElement) => {
  const src = image.getAttribute('src');
  if (!src) return null;

  const parsedSource = new URL(src, window.location.origin);
  return parsedSource.pathname === '/_next/image'
    ? parsedSource.searchParams.get('url')
    : src;
};

describe('Hero', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the CMS hero image returned by the home endpoint', async () => {
    // Falla si una imagen elegida en el CMS nunca llega al fondo visible del Home.
    mockedGet.mockResolvedValue({ data: { hero_image_url: 'https://files.example.test/cms-home.webp' } });

    render(<Hero />);

    const image = screen.getByTestId('hero-image');
    await waitFor(() => expect(renderedImageSource(image)).toBe('https://files.example.test/cms-home.webp'));
    expect(mockedGet).toHaveBeenCalledWith('/site/home/');
  });

  it('keeps the bundled hero image when the home request fails', async () => {
    // Falla si una caída de la API deja el Home sin el fondo disponible en el paquete publicado.
    mockedGet.mockRejectedValue(new Error('home endpoint unavailable'));

    render(<Hero />);

    const image = screen.getByTestId('hero-image');
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/site/home/'));
    expect(renderedImageSource(image)).toBe('/home/hero-background.webp');
  });

  it('restores the bundled hero image when the CMS file cannot load', async () => {
    // Falla si un archivo eliminado del CMS deja al visitante con un fondo roto.
    mockedGet.mockResolvedValue({ data: { hero_image_url: 'https://files.example.test/missing-home.webp' } });

    render(<Hero />);

    const image = screen.getByTestId('hero-image');
    await waitFor(() => expect(renderedImageSource(image)).toBe('https://files.example.test/missing-home.webp'));
    fireEvent.error(image);

    await waitFor(() => expect(renderedImageSource(image)).toBe('/home/hero-background.webp'));
  });
});
