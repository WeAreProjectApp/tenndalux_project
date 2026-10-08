import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Detail from '../blog/[slug]/BlogPostClient';
import { getBlogPost } from '@/lib/services/content';

jest.mock('@/lib/services/content', () => ({
  getBlogPost: jest.fn(),
  mediaUrl: (path: string) => path,
}));
jest.mock('@/components/layout/Header', () => function Header() { return <header />; });
jest.mock('@/components/layout/Footer', () => function Footer() { return <footer />; });
// Animation is an external boundary; jsdom cannot drive the real frame clock.
jest.mock('framer-motion', () => ({
  motion: { div: function MotionDiv({ children }: { children: React.ReactNode }) { return <div>{children}</div>; } },
}));

const mockedGet = getBlogPost as jest.MockedFunction<typeof getBlogPost>;
const item = { id: 1, title: 'Contenido recuperado', slug: '_shell', content_blocks: [], meta_title: 'Título del artículo' } as Awaited<ReturnType<typeof getBlogPost>>;
const unavailable = 'No pudimos cargar este artículo';

beforeEach(() => {
  jest.resetAllMocks();
  window.history.replaceState({}, '', '/blog/_shell/');
  document.title = 'Shell';
});

it('renders the fetched content', async () => {
  mockedGet.mockResolvedValue(item);
  render(<Detail />);

  expect(await screen.findByRole('heading', { name: item.title, level: 1 })).toBeVisible();
  expect(mockedGet).toHaveBeenCalledWith('_shell');
  expect(document.title).toBe(item.meta_title);
});

it('shows missing content only for HTTP 404', async () => {
  mockedGet.mockRejectedValue({ isAxiosError: true, response: { status: 404 } });
  render(<Detail />);

  expect(await screen.findByRole('heading', { name: 'No encontramos este artículo' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
});

it.each([
  ['503', { isAxiosError: true, response: { status: 503 } }],
  ['timeout', { isAxiosError: true, code: 'ECONNABORTED' }],
  ['network', { isAxiosError: true, code: 'ERR_NETWORK' }],
])('recovers after %s through the retry button', async (_kind, error) => {
  mockedGet.mockRejectedValueOnce(error).mockResolvedValueOnce(item);
  render(<Detail />);
  expect(await screen.findByRole('heading', { name: unavailable })).toBeVisible();
  expect(document.title).toBe('Shell');

  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

  expect(await screen.findByRole('heading', { name: item.title, level: 1 })).toBeVisible();
  expect(mockedGet).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('does not change the title after unmounting', async () => {
  let resolve!: (value: typeof item) => void;
  mockedGet.mockReturnValue(new Promise((done) => { resolve = done; }));
  const { unmount } = render(<Detail />);
  unmount();

  await act(async () => { resolve(item); });

  expect(document.title).toBe('Shell');
});



  it.each(['native', 'clipboard'])('keeps the article readable after %s rejects', async (integration) => {
    const reject = jest.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'share', { configurable: true, value: integration === 'native' ? reject : undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: reject } });
    mockedGet.mockResolvedValue(item);
    render(<Detail />);
    await screen.findByRole('heading', { name: item.title, level: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() => expect(reject).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: item.title, level: 1 })).toBeVisible();
  });
