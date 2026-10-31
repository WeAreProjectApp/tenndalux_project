import { fireEvent, render, screen, within } from '@testing-library/react';
import Products from '@/app/productos/page';
import Services from '@/app/servicios/page';
import { get } from '@/lib/services/http';
import products from '@/e2e/fixtures/products.json';

jest.mock('@/lib/services/http', () => ({ get: jest.fn() }));
jest.mock('@/components/layout/Header', () => function Header() { return <header />; });
jest.mock('@/components/layout/Footer', () => function Footer() { return <footer />; });
jest.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('swiper/modules', () => ({ Autoplay: {}, Pagination: {} }));

const mockedGet = get as jest.Mock;
const edited = { ...products[0], name: 'Ondas de lino', description: 'Una descripción del cliente.',
  category: 'persianas', image_url: '/media/products/linen.png' };

beforeEach(() => {
  jest.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

it('filters using the category saved by the client', async () => {
  mockedGet.mockResolvedValue({ data: [edited, products[1]] });
  render(<Products />);
  await screen.findByRole('heading', { name: 'Ondas de lino' });

  fireEvent.click(screen.getByRole('button', { name: 'Persianas', exact: true }));

  expect(screen.getByRole('heading', { name: 'Ondas de lino' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Luminux' })).not.toBeInTheDocument();
});

it('shows the saved presentation with the original technical details', async () => {
  mockedGet.mockResolvedValue({ data: [edited] });
  render(<Products />);

  fireEvent.click(await screen.findByRole('button', { name: 'Ver Detalles' }));

  const dialog = within(screen.getByRole('dialog', { name: edited.name }));
  expect(dialog.getByText(edited.description)).toBeInTheDocument();
  expect(decodeURIComponent(dialog.getByRole('img', { name: edited.name }).getAttribute('src') || '')).toContain(edited.image_url);
  expect(dialog.getByText('Salas amplias')).toBeInTheDocument();
  expect(dialog.getByRole('button', { name: `Cotizar ${edited.name}` })).toBeInTheDocument();
});

it('uses the same saved product presentation in Services', async () => {
  mockedGet.mockResolvedValue({ data: [edited] });
  render(<Services />);

  expect(await screen.findByRole('heading', { name: edited.name })).toBeInTheDocument();
  expect(screen.getByText(edited.description)).toBeInTheDocument();
  expect(decodeURIComponent(screen.getByRole('img', { name: edited.name }).getAttribute('src') || '')).toContain(edited.image_url);
  expect(screen.getByRole('link', { name: `Cotizar ${edited.name}` })).toHaveAttribute('href', expect.stringContaining('Ondas%20de%20lino'));
});

it('uses the saved wall-covering presentation in Services', async () => {
  mockedGet.mockResolvedValue({ data: [{ ...products[9], name: 'Muro natural', description: 'Papel artesanal.' }] });
  render(<Services />);

  fireEvent.click(screen.getByRole('button', { name: 'Recubrimientos', exact: true }));

  expect(await screen.findByRole('heading', { name: 'Muro natural' })).toBeInTheDocument();
  expect(screen.getByText('Papel artesanal.')).toBeInTheDocument();
  expect(decodeURIComponent(screen.getByRole('img', { name: 'Muro natural' }).getAttribute('src') || '')).toContain(products[9].image_url);
});

it('uses the saved exterior presentation in Services', async () => {
  mockedGet.mockResolvedValue({ data: [{ ...products[12], name: 'Pérgola de lino', description: 'Techo retráctil nuevo.' }] });
  render(<Services />);
  fireEvent.click(screen.getByRole('button', { name: 'Exteriores', exact: true }));

  expect(await screen.findAllByRole('heading', { name: 'Pérgola de lino' })).toHaveLength(2);
  expect(decodeURIComponent(screen.getAllByRole('img', { name: 'Pérgola de lino' })[0].getAttribute('src') || '')).toContain(products[12].image_url);
});

it.each([['Productos', Products], ['Servicios', Services]])('shows loading before %s responds', (_name, Page) => {
  mockedGet.mockReturnValue(new Promise(() => {}));
  render(<Page />);

  expect(screen.getByRole('status')).toHaveTextContent('Cargando productos…');
});

it.each([['Productos', Products], ['Servicios', Services]])('recovers %s after a failed read', async (_name, Page) => {
  mockedGet.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({ data: [edited] });
  render(<Page />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos.');

  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

  expect(await screen.findByRole('heading', { name: edited.name })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it.each([['Productos', Products], ['Servicios', Services]])('explains an empty %s catalogue', async (_name, Page) => {
  mockedGet.mockResolvedValue({ data: [] });
  render(<Page />);

  expect(await screen.findByText(/No hay productos disponibles/)).toBeInTheDocument();
});

it.each([{ response: {} }, { response: [{ key: 'unknown-product' }] }])('retains the page when the catalogue response is malformed: $response', async ({ response: data }) => {
  mockedGet.mockResolvedValue({ data });
  render(<Products />);

  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos.');
  expect(screen.getByRole('heading', { name: 'Nuestros Productos' })).toBeInTheDocument();
});
