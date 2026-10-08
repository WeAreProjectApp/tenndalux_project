import { render, screen } from '@testing-library/react';
import CurtainCard from '../CurtainCard';
import { CURTAINS } from '@/lib/data/curtains';

const curtain = CURTAINS[0];

describe('CurtainCard', () => {
  it('shows the image before the text on mobile, and beside it from md up', () => {
    render(<CurtainCard curtain={curtain} />);
    const figure = screen.getByRole('img', { name: curtain.title }).parentElement;

    // order-first la sube en la columna única del móvil; md:order-none la
    // devuelve a su lugar en el DOM, que es la segunda celda de la grilla.
    expect(figure).toHaveClass('order-first', 'md:order-none');
  });

  it('frames the image at the ratio the photos actually have', () => {
    render(<CurtainCard curtain={curtain} />);
    const image = screen.getByRole('img', { name: curtain.title });
    expect(image.parentElement).toHaveClass('aspect-[4/5]');
    expect(image.parentElement).not.toHaveClass('aspect-[4/3]');
    expect(decodeURIComponent(image.getAttribute('src') || '')).toContain(curtain.image);
  });

  it('still renders the curtain content', () => {
    render(<CurtainCard curtain={curtain} />);

    expect(screen.getByRole('heading', { name: curtain.title })).toBeInTheDocument();
    expect(screen.getByAltText(curtain.title)).toBeInTheDocument();
    expect(screen.getByText(curtain.beneficios[0])).toBeInTheDocument();
  });
});
