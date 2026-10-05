import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import Contact from '@/components/home/Contact';
import { createLead } from '@/lib/services/leads';

jest.mock('gsap', () => ({
  registerPlugin: jest.fn(),
  context: (callback: () => void) => {
    callback();
    return { revert: jest.fn() };
  },
  fromTo: jest.fn(),
}));
jest.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
jest.mock('@/lib/services/leads', () => ({ createLead: jest.fn() }));

const mockedCreateLead = createLead as jest.MockedFunction<typeof createLead>;

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Rodríguez' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '3000000000' } });
}

function submitForm() {
  const submit = screen.getByRole('button', { name: 'Enviar Solicitud' });
  fireEvent.submit(submit.form!);
}

describe('Contact form additional project details', () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([
    {
      fieldLabel: '¿Para cuántos espacios buscas cortinas o soluciones de control solar?',
      formValue: '3',
      expectedPayload: { spaces_count: 3 },
      responseName: 'space count',
    },
    {
      fieldLabel: '¿Dónde se ubica tu proyecto?',
      formValue: ' Bogotá, Chapinero ',
      expectedPayload: { city: 'Bogotá, Chapinero' },
      responseName: 'project location',
    },
  ])('serializes the $responseName response in the lead payload', async ({ fieldLabel, formValue, expectedPayload }) => {
    // Falla si una respuesta nueva se pierde, conserva espacios o cambia su tipo antes de llegar al lead.
    mockedCreateLead.mockResolvedValue();
    render(createElement(Contact));
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(fieldLabel), {
      target: { value: formValue },
    });

    submitForm();

    await waitFor(() => expect(mockedCreateLead).toHaveBeenCalledWith({
      full_name: 'Ana Rodríguez',
      email: 'ana@example.com',
      phone: '3000000000',
      message: 'Me interesa: Cortina Ondessence',
      source: 'formulario-home',
      ...expectedPayload,
    }));
  });

  it('clears project details after the lead is accepted', async () => {
    // Falla si un envío exitoso deja datos del proyecto en la siguiente solicitud.
    mockedCreateLead.mockResolvedValue();
    render(createElement(Contact));
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText('¿Para cuántos espacios buscas cortinas o soluciones de control solar?'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText('¿Dónde se ubica tu proyecto?'), {
      target: { value: 'Bogotá' },
    });

    submitForm();

    await screen.findByText('¡Solicitud enviada!');
    expect(screen.getByLabelText('¿Para cuántos espacios buscas cortinas o soluciones de control solar?')).toHaveValue(null);
    expect(screen.getByLabelText('¿Dónde se ubica tu proyecto?')).toHaveValue('');
  });

  test.each(['1.5', '0'])('blocks the invalid space count %s before creating a lead', (spacesCount) => {
    // Falla si una cantidad no entera o menor que uno llega al endpoint público.
    render(createElement(Contact));
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText('¿Para cuántos espacios buscas cortinas o soluciones de control solar?'), {
      target: { value: spacesCount },
    });

    submitForm();

    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa una cantidad entera de espacios desde 1.');
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('blocks an overlong location before creating a lead', () => {
    // Falla si un envío programático puede superar el límite que acepta la API.
    render(createElement(Contact));
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText('¿Dónde se ubica tu proyecto?'), {
      target: { value: 'x'.repeat(121) },
    });

    submitForm();

    expect(screen.getByRole('alert')).toHaveTextContent('La ubicación debe tener como máximo 120 caracteres.');
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('submits only one request while the first lead is pending', async () => {
    // Falla si dos activaciones rápidas del botón crean solicitudes duplicadas.
    let resolveLead: () => void = () => undefined;
    mockedCreateLead.mockReturnValue(new Promise<void>((resolve) => {
      resolveLead = resolve;
    }));
    render(createElement(Contact));
    fillRequiredFields();

    const submit = screen.getByRole('button', { name: 'Enviar Solicitud' });
    fireEvent.submit(submit.form!);
    fireEvent.submit(submit.form!);

    expect(mockedCreateLead).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Enviando...');
    await act(async () => resolveLead());
    expect(await screen.findByText('¡Solicitud enviada!')).toBeInTheDocument();
  });
});
