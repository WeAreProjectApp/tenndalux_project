import { fireEvent, render, screen } from '@testing-library/react';
import Portafolio from '../page';
import { listPortfolioProjects } from '@/lib/services/content';
import type { PortfolioProject } from '@/types/content';

jest.mock('@/lib/services/content', () => ({
  listPortfolioProjects: jest.fn(),
  mediaUrl: (path: string) => path,
}));
jest.mock('@/components/layout/Header', () => function Header() { return <header />; });
jest.mock('@/components/layout/Footer', () => function Footer() { return <footer />; });

const mockedList = listPortfolioProjects as jest.MockedFunction<typeof listPortfolioProjects>;

const project = (overrides: Partial<PortfolioProject> = {}): PortfolioProject => ({
  id: 1,
  title: 'Residencia Premium Envigado',
  slug: 'residencia-premium-envigado',
  description: 'Automatización completa.',
  content_blocks: [],
  cover_image_url: '/media/portada.webp',
  location: 'Envigado, Antioquia',
  year: 2026,
  featured: false,
  categories: [{ id: 1, name: 'Residencial', slug: 'residencial' }],
  styles: [
    { id: 1, name: 'Cortinas Roller', slug: 'roller' },
    { id: 2, name: 'Automatización', slug: 'automatizacion' },
  ],
  ...overrides,
});

describe('Portfolio list', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the projects published in the admin', async () => {
    mockedList.mockResolvedValue([project(), project({ id: 2, title: 'Oficinas Medellín', slug: 'oficinas' })]);
    render(<Portafolio />);

    expect(await screen.findByRole('heading', { name: 'Residencia Premium Envigado', level: 2 })).toHaveTextContent('Residencia Premium Envigado');
    expect(screen.getAllByRole('heading', { name: 'Oficinas Medellín', level: 3 })).toHaveLength(2);
  });

  it('builds the category filter from the categories the projects carry', async () => {
    mockedList.mockResolvedValue([
      project(),
      project({ id: 2, slug: 'b', title: 'B', categories: [{ id: 2, name: 'Hotelería', slug: 'hoteleria' }] }),
    ]);
    render(<Portafolio />);

    expect(await screen.findByRole('button', { name: 'Residencial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hotelería' })).toBeInTheDocument();
    // Antes la lista era fija e incluía categorías sin un solo proyecto.
    expect(screen.queryByRole('button', { name: 'Comercial' })).not.toBeInTheDocument();
  });

  it('uses the styles as the project type', async () => {
    mockedList.mockResolvedValue([project()]);
    render(<Portafolio />);

    expect(await screen.findAllByText('Cortinas Roller + Automatización')).toHaveLength(1);
  });

  it('respects the featured flag set in the admin', async () => {
    mockedList.mockResolvedValue([
      project({ id: 1, title: 'Normal', slug: 'normal', featured: false }),
      project({ id: 2, title: 'El destacado', slug: 'destacado', featured: true }),
    ]);
    render(<Portafolio />);

    expect(await screen.findByRole('heading', { name: 'El destacado', level: 2 })).toHaveTextContent('El destacado');
  });

  it('promotes the first project when nobody marked one as featured', async () => {
    mockedList.mockResolvedValue([
      project({ id: 1, title: 'Primero', slug: 'primero', featured: false }),
      project({ id: 2, title: 'Segundo', slug: 'segundo', featured: false }),
    ]);
    render(<Portafolio />);

    // Sin esto la franja destacada de arriba quedaría vacía.
    expect(await screen.findByRole('heading', { name: 'Primero', level: 2 })).toHaveTextContent('Primero');
  });

  it('does not claim there are no results while it is still loading', () => {
    mockedList.mockReturnValue(new Promise(() => {}));
    render(<Portafolio />);

    expect(screen.getByLabelText('Cargando proyectos')).toBeInTheDocument();
  });

  it('keeps another featured project in the catalogue', async () => {
    mockedList.mockResolvedValue([
      project({ featured: true }),
      project({ id: 2, title: 'Segundo destacado', slug: 'segundo', featured: true }),
    ]);
    render(<Portafolio />);

    expect(await screen.findAllByRole('heading', { name: 'Segundo destacado', level: 3 })).toHaveLength(2);
  });

  it('includes the cover project in its category', async () => {
    mockedList.mockResolvedValue([project({ featured: true })]);
    render(<Portafolio />);

    fireEvent.click(await screen.findByRole('button', { name: 'Residencial' }));

    expect(screen.getAllByRole('heading', { name: 'Residencia Premium Envigado', level: 3 })).toHaveLength(2);
    expect(screen.queryByText(/No hay proyectos/)).not.toBeInTheDocument();
  });

  it('restores the cover without a duplicate card after clearing the category', async () => {
    mockedList.mockResolvedValue([project({ featured: true })]);
    render(<Portafolio />);
    fireEvent.click(await screen.findByRole('button', { name: 'Residencial' }));

    fireEvent.click(screen.getByRole('button', { name: 'Todos', exact: true }));

    expect(screen.getByRole('heading', { name: 'Residencia Premium Envigado', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Residencia Premium Envigado', level: 3 })).not.toBeInTheDocument();
  });

  it('does not show an empty notice beside a lone cover project', async () => {
    mockedList.mockResolvedValue([project()]);
    render(<Portafolio />);

    expect(await screen.findByRole('heading', { name: 'Residencia Premium Envigado', level: 2 })).toHaveTextContent('Residencia Premium Envigado');

    expect(screen.queryByText(/No hay proyectos/)).not.toBeInTheDocument();
  });

  it('distinguishes a failed request from an empty catalogue', async () => {
    mockedList.mockRejectedValue(new Error('Unavailable'));
    render(<Portafolio />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los proyectos');
    expect(screen.queryByText(/No hay proyectos/)).not.toBeInTheDocument();
  });

  it('recovers published projects on a manual retry', async () => {
    mockedList.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([project()]);
    render(<Portafolio />);

    fireEvent.click(await screen.findByRole('button', { name: 'Volver a intentar' }));

    expect(await screen.findByRole('heading', { name: 'Residencia Premium Envigado', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the bundled WebP when no cover was uploaded', async () => {
    mockedList.mockResolvedValue([project({ cover_image_url: null })]);
    render(<Portafolio />);

    const image = await screen.findByAltText('Residencia Premium Envigado');
    expect(decodeURIComponent(image.getAttribute('src') || '')).toContain('/home/gallery/ejemplo-uso-general.webp');
  });
});
