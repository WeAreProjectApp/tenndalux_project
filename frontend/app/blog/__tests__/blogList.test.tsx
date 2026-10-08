import { fireEvent, render, screen } from '@testing-library/react';
import Blog from '../page';
import { listBlogPosts } from '@/lib/services/content';
import type { BlogPost } from '@/types/content';

jest.mock('@/lib/services/content', () => ({
  listBlogPosts: jest.fn(),
  mediaUrl: (path: string) => path,
}));
jest.mock('@/components/layout/Header', () => function Header() { return <header />; });
jest.mock('@/components/layout/Footer', () => function Footer() { return <footer />; });

const mockedList = listBlogPosts as jest.MockedFunction<typeof listBlogPosts>;

const post = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: 1,
  title: 'Cortinas inteligentes',
  slug: 'cortinas-inteligentes',
  excerpt: 'Qué son y cómo elegirlas.',
  content_blocks: [],
  cover_image_url: '/media/portada.webp',
  published_at: '2026-08-01T10:00:00Z',
  created_at: '2026-08-01T10:00:00Z',
  meta_title: '',
  meta_description: '',
  tags: [{ id: 1, name: 'Tecnología', slug: 'tecnologia' }],
  read_time_minutes: 8,
  ...overrides,
});

describe('Blog list', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the posts published in the admin', async () => {
    mockedList.mockResolvedValue([post(), post({ id: 2, title: 'Persianas celulares', slug: 'persianas' })]);
    render(<Blog />);

    // La página pinta variante móvil y de escritorio, de ahí el getAll.
    expect(await screen.findAllByText('Cortinas inteligentes')).not.toHaveLength(0);
    expect(screen.getAllByText('Persianas celulares')).not.toHaveLength(0);
  });

  it('builds the category filter from the tags the posts actually carry', async () => {
    mockedList.mockResolvedValue([
      post({ tags: [{ id: 1, name: 'Tecnología', slug: 'tecnologia' }] }),
      post({ id: 2, slug: 'b', title: 'B', tags: [{ id: 2, name: 'Diseño', slug: 'diseno' }] }),
    ]);
    render(<Blog />);

    expect(await screen.findByRole('button', { name: 'Tecnología' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diseño' })).toBeInTheDocument();
    // Antes estaban fijas en el código e incluían categorías sin un solo post.
    expect(screen.queryByRole('button', { name: 'Sostenibilidad' })).not.toBeInTheDocument();
  });

  it('shows the read time the backend computed', async () => {
    mockedList.mockResolvedValue([post({ read_time_minutes: 12 })]);
    render(<Blog />);

    expect(await screen.findAllByText(/12 min/)).not.toHaveLength(0);
  });

  it('labels a post with no tags rather than leaving the badge empty', async () => {
    mockedList.mockResolvedValue([post({ tags: [] })]);
    render(<Blog />);

    // El botón del filtro y la insignia de la tarjeta, ambos con la etiqueta.
    expect(await screen.findByRole('button', { name: 'General' })).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(1);
  });

  it('does not claim there are no results while it is still loading', () => {
    mockedList.mockReturnValue(new Promise(() => {}));
    render(<Blog />);

    expect(screen.queryByText(/No encontramos artículos/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cargando artículos')).toBeInTheDocument();
  });

  it('says so when the admin has published nothing', async () => {
    mockedList.mockResolvedValue([]);
    render(<Blog />);

    expect(await screen.findByText(/No encontramos artículos/)).toBeInTheDocument();
  });

  it('finds the cover post when its title is searched', async () => {
    mockedList.mockResolvedValue([post(), post({ id: 2, title: 'Otro artículo', slug: 'otro' })]);
    render(<Blog />);
    await screen.findByRole('heading', { name: 'Cortinas inteligentes', level: 2 });

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar artículos' }), { target: { value: 'inteligentes' } });

    expect(screen.getAllByRole('heading', { name: 'Cortinas inteligentes', level: 3 })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Otro artículo' })).not.toBeInTheDocument();
  });

  it('includes the cover post in its category', async () => {
    mockedList.mockResolvedValue([post()]);
    render(<Blog />);

    fireEvent.click(await screen.findByRole('button', { name: 'Tecnología' }));

    expect(screen.getAllByRole('heading', { name: 'Cortinas inteligentes', level: 3 })).toHaveLength(2);
    expect(screen.queryByText(/No encontramos artículos/)).not.toBeInTheDocument();
  });

  it('restores the cover without a duplicate card after clearing the category', async () => {
    mockedList.mockResolvedValue([post()]);
    render(<Blog />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tecnología' }));

    fireEvent.click(screen.getByRole('button', { name: 'Todos', exact: true }));

    expect(screen.getByRole('heading', { name: 'Cortinas inteligentes', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cortinas inteligentes', level: 3 })).not.toBeInTheDocument();
  });

  it('does not show an empty notice beside a lone cover post', async () => {
    mockedList.mockResolvedValue([post()]);
    render(<Blog />);

    await screen.findByRole('heading', { name: 'Cortinas inteligentes', level: 2 });

    expect(screen.queryByText(/No encontramos artículos/)).not.toBeInTheDocument();
  });

  it('distinguishes a failed request from an empty catalogue', async () => {
    mockedList.mockRejectedValue(new Error('Unavailable'));
    render(<Blog />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los artículos');
    expect(screen.queryByText(/No encontramos artículos/)).not.toBeInTheDocument();
  });

  it('recovers published articles on a manual retry', async () => {
    mockedList.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([post()]);
    render(<Blog />);

    fireEvent.click(await screen.findByRole('button', { name: 'Volver a intentar' }));

    expect(await screen.findByRole('heading', { name: 'Cortinas inteligentes', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the bundled WebP when no cover was uploaded', async () => {
    mockedList.mockResolvedValue([post({ cover_image_url: null })]);
    render(<Blog />);

    expect(await screen.findByAltText('Cortinas inteligentes')).toHaveAttribute('src', '/home/gallery/cortina-ondessence.webp');
  });
});
