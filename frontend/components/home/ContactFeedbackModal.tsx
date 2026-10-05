'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { whatsappUrl } from '@/lib/whatsapp';

export type ContactFeedbackStatus = 'success' | 'error';

type Props = {
  status: ContactFeedbackStatus | null;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const COPY = {
  success: {
    title: '¡Solicitud enviada!',
    body: 'Gracias por escribirnos. Un asesor de Tenndalux te contactará dentro de las próximas 24 horas hábiles para agendar tu asesoría.',
    aside: '¿Prefieres hablar ahora?',
    cta: 'Escribirnos por WhatsApp',
    interest: 'agendar mi asesoría',
    dismiss: 'Volver al sitio',
  },
  error: {
    title: 'No pudimos enviar tu solicitud',
    body: 'Algo falló al enviar el formulario. Puedes intentarlo de nuevo en un momento, o escribirnos directamente y lo resolvemos por ahí.',
    aside: 'La vía más rápida:',
    cta: 'Escribirnos por WhatsApp',
    interest: 'agendar una asesoría',
    dismiss: 'Volver e intentar de nuevo',
  },
} as const;

/**
 * Confirmación del formulario de contacto del home.
 *
 * Reemplaza al `alert()` del navegador, que no se puede diseñar, bloquea el
 * hilo y en móvil aparece como un aviso del sistema —lo que lo hace leer como
 * un error y no como un acuse de recibo.
 */
export default function ContactFeedbackModal({ status, onClose, returnFocusRef }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isOpen = status !== null;

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // The pending submit is disabled, which can move activeElement to body.
    const previousFocus = returnFocusRef?.current ?? document.activeElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]',
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        const outside = !dialogRef.current?.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || outside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || outside)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // Mismo bloqueo de scroll que usan las hojas inferiores de /servicios.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen, returnFocusRef]);

  const copy = status ? COPY[status] : null;
  const isError = status === 'error';

  return (
    <AnimatePresence>
      {copy && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-feedback-title"
            aria-describedby="contact-feedback-body"
            className="relative flex w-full max-w-md max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-white rounded-3xl shadow-2xl text-center"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="min-h-0 overflow-y-auto p-8 sm:p-10">
              <span
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                  isError ? 'bg-amber-50 text-amber-600' : 'bg-stone-900 text-stone-50'
                }`}
              >
                {isError ? (
                  <ExclamationTriangleIcon className="w-8 h-8" aria-hidden="true" />
                ) : (
                  <CheckIcon className="w-8 h-8" aria-hidden="true" />
                )}
              </span>

              <h3 id="contact-feedback-title" className="text-2xl font-bold text-stone-900 mb-3 tracking-tight">
                {copy.title}
              </h3>
              <p id="contact-feedback-body" role={isError ? 'alert' : 'status'} className="text-stone-600 leading-relaxed mb-8">{copy.body}</p>

              <div className="border-t border-stone-100 pt-6 space-y-4">
                <p className="text-sm text-stone-500">{copy.aside}</p>
                <a
                  href={whatsappUrl(copy.interest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-8 py-4 rounded-full bg-stone-900 text-stone-50 font-semibold hover:bg-stone-800 transition-colors"
                >
                  {copy.cta}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 w-full py-3 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {copy.dismiss}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
