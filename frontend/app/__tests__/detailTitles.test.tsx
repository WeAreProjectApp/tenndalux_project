import { act, render, screen, waitFor } from '@testing-library/react';
import Blog from '../blog/[slug]/BlogPostClient';
import Portfolio from '../portafolio/[slug]/PortafolioProjectClient';
import { getBlogPost, getPortfolioProject } from '@/lib/services/content';

jest.mock('@/lib/services/content', () => ({
  getBlogPost: jest.fn(), getPortfolioProject: jest.fn(), mediaUrl: (path: string) => path,
}));
jest.mock('@/components/layout/Header', () => function Header() { return <header />; });
jest.mock('@/components/layout/Footer', () => function Footer() { return <footer />; });
jest.mock('framer-motion', () => ({
  motion: { div: function MotionDiv({ children }: { children: React.ReactNode }) { return <div>{children}</div>; } },
}));

const modules = [
  { label: 'blog', Component: Blog, load: getBlogPost as jest.Mock,
    item: { title: 'Artículo de prueba', meta_title: 'Título editorial', content_blocks: [] },
    expected: 'Título editorial' },
  { label: 'portfolio', Component: Portfolio, load: getPortfolioProject as jest.Mock,
    item: { title: 'Proyecto de prueba', content_blocks: [] },
    expected: 'Proyecto de prueba — Tenndalux' },
];

beforeEach(() => {
  jest.resetAllMocks();
  window.history.replaceState({}, '', '/detail/_shell/');
  document.title = 'Shell';
});

it.each(modules)('$label retains its title after streamed metadata arrives', async ({ Component, load, item, expected }) => {
  load.mockResolvedValue(item);
  render(<Component />);
  await screen.findByRole('heading', { name: item.title, level: 1 });

  await act(async () => { document.title = 'Generic streamed metadata'; });

  await waitFor(() => expect(document.title).toBe(expected));
});

it.each(modules)('$label releases title ownership when leaving its route', async ({ Component, load, item }) => {
  load.mockResolvedValue(item);
  const { unmount } = render(<Component />);
  await screen.findByRole('heading', { name: item.title, level: 1 });
  window.history.replaceState({}, '', '/next-page/');
  await act(async () => { document.title = 'Next page metadata'; });
  expect(document.title).toBe('Next page metadata');
  unmount();

  await act(async () => { document.title = 'Next page'; });

  expect(document.title).toBe('Next page');
});
