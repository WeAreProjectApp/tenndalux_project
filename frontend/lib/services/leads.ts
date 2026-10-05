/**
 * Solicitudes del formulario de contacto.
 *
 * `POST /leads/leads/` es público (AllowAny en LeadViewSet); el resto del
 * recurso exige autenticación, así que este servicio sólo expone la creación.
 */
import { post } from '@/lib/services/http';

export type LeadPayload = {
  full_name: string;
  email: string;
  phone: string;
  message: string;
  /** Identifica de qué formulario vino, para distinguirlos en el admin. */
  source: string;
  city?: string;
  spaces_count?: number;
};

export async function createLead(payload: LeadPayload): Promise<void> {
  await post('/leads/leads/', payload);
}
