import { render, screen } from '@testing-library/react';
import BlockRenderer from '../BlockRenderer';
import type { ContentBlock } from '@/types/content';

const textBlocks: Array<{ block: ContentBlock; expected: string }> = [
  { block: { type: 'parrafo', heading: 'Qué son', text: 'Sistemas motorizados.' }, expected: 'Sistemas motorizados.' },
  { block: { type: 'lista', items: ['Control de luz'] }, expected: 'Control de luz' },
  { block: { type: 'ejemplos', items: ['Oficinas en casa'] }, expected: 'Oficinas en casa' },
  { block: { type: 'subsecciones', items: [{ title: 'Básico', description: 'Un motor.' }] }, expected: 'Un motor.' },
  { block: { type: 'linea_de_tiempo', steps: [{ step: 'Medición', description: 'Visita.', duration: '1 día' }] }, expected: 'Visita.' },
  { block: { type: 'metricas', items: [{ metric: '-40%', description: 'Menos calor.' }] }, expected: 'Menos calor.' },
  { block: { type: 'testimonio', text: 'Impecable.', author: 'Ana', role: 'Cliente' }, expected: 'Impecable.' },
  { block: { type: 'cierre', text: 'Cada espacio es distinto.', note: 'Escríbenos.' }, expected: 'Cada espacio es distinto.' },
];

describe('BlockRenderer', () => {
  it.each(textBlocks)('renders $block.type content', ({ block, expected }) => {
    render(<BlockRenderer blocks={[block]} />);

    expect(screen.getByText(expected, { exact: false })).toBeVisible();
  });

  it('renders the gallery image supplied by the backend', () => {
    render(<BlockRenderer blocks={[
      { type: 'galeria', images: [{ id: 'img_1', url: '/media/a.webp', alt: 'Sala' }] },
    ]} />);

    expect(screen.getByRole('img', { name: 'Sala' })).toHaveAttribute(
      'src', expect.stringMatching(/(?:\/media\/a\.webp|url=%2Fmedia%2Fa\.webp)(?:$|&)/),
    );
  });

  it('keeps the order the admin gave the blocks', () => {
    render(<BlockRenderer blocks={[
      { type: 'parrafo', text: 'Primero' },
      { type: 'parrafo', text: 'Segundo' },
      { type: 'parrafo', text: 'Tercero' },
    ]} />);

    const texts = screen.getAllByText(/Primero|Segundo|Tercero/).map((node) => node.textContent);
    expect(texts).toEqual(['Primero', 'Segundo', 'Tercero']);
  });

  it.each([
    { title: undefined, expected: 'Video' },
    { title: 'Demo', expected: 'Demo' },
  ])('embeds the resolved video with title $expected', ({ title, expected }) => {
    render(<BlockRenderer blocks={[
      { type: 'video', youtube_url: 'https://youtu.be/unused', youtube_id: 'xyz', title },
    ]} />);

    expect(screen.getByTitle(expected)).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/xyz');
  });

  it('keeps readable content after an unresolved video', () => {
    render(<BlockRenderer blocks={[
      { type: 'video', youtube_url: 'roto', youtube_id: null },
      { type: 'parrafo', text: 'Texto después del video' },
    ]} />);

    expect(screen.getByText('Texto después del video')).toBeVisible();
    expect(screen.queryByTitle('Video')).not.toBeInTheDocument();
  });

  it('keeps readable content after a gallery loses its images', () => {
    render(<BlockRenderer blocks={[
      { type: 'galeria', heading: 'Antes y después', images: [] },
      { type: 'parrafo', text: 'Texto después de la galería' },
    ]} />);

    expect(screen.getByText('Texto después de la galería')).toBeVisible();
    expect(screen.queryByText('Antes y después')).not.toBeInTheDocument();
  });

  it('keeps readable content after an unknown block type', () => {
    const unknown = { type: 'mapa', lat: 4.7 } as unknown as ContentBlock;
    render(<BlockRenderer blocks={[unknown, { type: 'parrafo', text: 'Sigue vivo' }]} />);

    expect(screen.getByText('Sigue vivo')).toBeVisible();
  });
});
