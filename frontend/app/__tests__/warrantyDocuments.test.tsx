import { fireEvent, render, screen } from '@testing-library/react';
import WarrantyDocuments from '@/components/legal/WarrantyDocuments';
import { get } from '@/lib/services/http';

jest.mock('@/lib/services/http', () => ({ get: jest.fn() }));

const mockedGet = get as jest.Mock;

describe('WarrantyDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the published document returned by the warranty endpoint', async () => {
    // Falla si el mapeo del catálogo deja invisible un PDF publicado para visitantes.
    mockedGet.mockResolvedValue({
      data: [{ id: 8, title: 'Garantía de instalación', file_url: 'https://files.example.test/warranty.pdf' }],
    });

    render(<WarrantyDocuments />);

    const documentLink = await screen.findByRole('link', { name: 'Abrir Garantía de instalación (PDF)' });
    expect(mockedGet).toHaveBeenCalledWith('/site/warranties/');
    expect(documentLink).toHaveAttribute('href', 'https://files.example.test/warranty.pdf');
  });

  it('explains when there are no additional published documents', async () => {
    // Falla si un catálogo vacío se confunde con una pantalla rota o sin información.
    mockedGet.mockResolvedValue({ data: [] });

    render(<WarrantyDocuments />);

    expect(await screen.findByText('No hay documentos adicionales publicados por el momento.')).toBeInTheDocument();
  });

  it('loads a document after retrying a temporary warranty request failure', async () => {
    // Falla si un fallo temporal impide que el visitante recupere el catálogo sin recargar la página.
    mockedGet
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce({
        data: [{ id: 9, title: 'Garantía de producto', file_url: 'https://files.example.test/product.pdf' }],
      });

    render(<WarrantyDocuments />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los documentos.');
    fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }));

    const documentLink = await screen.findByRole('link', { name: 'Abrir Garantía de producto (PDF)' });
    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(documentLink).toHaveAttribute('href', 'https://files.example.test/product.pdf');
  });
});
