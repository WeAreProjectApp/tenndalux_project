'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import ContactFeedbackModal, { type ContactFeedbackStatus } from '@/components/home/ContactFeedbackModal';
import { createLead } from '@/lib/services/leads';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from '@/messages/es.json';

gsap.registerPlugin(ScrollTrigger);

const INTERESTS = [
  { value: 'ondessence', label: 'Cortina Ondessence' },
  { value: 'luminux', label: 'Luminux' },
  { value: 'dunes', label: 'Dunes' },
  { value: 'automatizacion', label: 'Tecnología y Automatización' },
  { value: 'paredes', label: 'Recubrimientos para Paredes' },
  { value: 'exterior', label: 'Soluciones para Exterior' },
  { value: 'otro', label: 'Otro' },
] as const;

const EMPTY_FORM = {
  name: '',
  lastname: '',
  email: '',
  phone: '',
  interest: INTERESTS[0].value as string,
  spacesCount: '',
  location: '',
};

export default function Contact() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota">
      <ContactForm />
    </NextIntlClientProvider>
  );
}

function ContactForm() {
  const t = useTranslations('contact');
  const [isInteractive, setIsInteractive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<ContactFeedbackStatus | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<{ spacesCount?: string; location?: string }>({});
  const submittingRef = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  const setField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Apple-style blur reveal
      gsap.fromTo(leftRef.current,
        { opacity: 0, y: 70, filter: 'blur(15px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
        }
      );

      gsap.fromTo(rightRef.current,
        { opacity: 0, y: 60, scale: 0.95, filter: 'blur(12px)' },
        {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          duration: 1.3, delay: 0.15, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const spacesCount = form.spacesCount.trim() ? Number(form.spacesCount) : undefined;
    const city = form.location.trim();
    const errors: typeof fieldErrors = {};
    if (spacesCount !== undefined && (!Number.isInteger(spacesCount) || spacesCount < 1 || spacesCount > 2147483647)) {
      errors.spacesCount = t('spacesCountError');
    }
    if (city.length > 120) errors.location = t('locationError');
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    submittingRef.current = true;
    setLoading(true);

    // El interés viaja en `message` y no en `project_type`: ese campo es una FK
    // a Category y las opciones del select no son categorías del portafolio,
    // así que mapearlas inventaría una relación que no existe.
    const interest = INTERESTS.find((option) => option.value === form.interest);

    try {
      await createLead({
        full_name: `${form.name} ${form.lastname}`.trim(),
        email: form.email,
        phone: form.phone,
        message: `Me interesa: ${interest?.label ?? form.interest}`,
        source: 'formulario-home',
        ...(city ? { city } : {}),
        ...(spacesCount !== undefined ? { spaces_count: spacesCount } : {}),
      });
      setForm(EMPTY_FORM);
      setFeedback('success');
    } catch {
      setFeedback('error');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <section ref={sectionRef} id="contacto" className="py-20 md:py-36 bg-stone-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid lg:grid-cols-[1fr_580px] gap-12 lg:gap-28 items-start">
          <div ref={leftRef} className="space-y-14 pt-4">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                Hablemos de<br />tu proyecto
              </h2>
              <p className="text-stone-400 text-xl md:text-2xl leading-relaxed font-light max-w-[520px]">
                Nuestros expertos están listos para diseñar la solución perfecta para tus espacios.
              </p>
            </div>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="p-5 bg-stone-800/60 rounded-2xl border border-stone-700">
                  <PhoneIcon className="w-10 h-10 text-stone-200 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-2xl">Ventas</h3>
                  <p className="text-stone-400 mt-2 text-xl font-light">322 790 4563</p>
                  <h3 className="font-semibold text-white text-2xl mt-4">Servicio al cliente</h3>
                  <p className="text-stone-400 mt-2 text-xl font-light">300 965 0060</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-5 bg-stone-800/60 rounded-2xl border border-stone-700">
                  <EnvelopeIcon className="w-10 h-10 text-stone-200 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-2xl">Escríbenos</h3>
                  <p className="text-stone-400 mt-2 text-xl font-light">info@tenndalux.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-5 bg-stone-800/60 rounded-2xl border border-stone-700">
                  <MapPinIcon className="w-10 h-10 text-stone-200 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-2xl">Horario</h3>
                  <p className="text-stone-400 mt-2 text-xl font-light">Lun - Vie: 8:30 a.m. – 5:00 p.m.</p>
                  <p className="text-stone-400 mt-1 text-xl font-light">Sábados: 8:30 a.m. – 12:00 m.</p>
                </div>
              </div>
            </div>
          </div>

          <div ref={rightRef} className="bg-white/95 backdrop-blur rounded-[2rem] p-10 sm:p-12 md:p-14 shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-white/20">
            <div className="space-y-4 mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">Solicitar Asesoría</h3>
              <p className="text-stone-500 text-lg leading-relaxed">Completa el formulario y te contactaremos.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <fieldset disabled={!isInteractive} className="m-0 min-w-0 space-y-6 border-0 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-stone-700">Nombre</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastname" className="text-sm font-medium text-stone-700">Apellido</label>
                    <input
                      type="text"
                      id="lastname"
                      required
                      value={form.lastname}
                      onChange={(e) => setField('lastname', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-stone-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-stone-700">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                    placeholder="+57 (300) 000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="interest" className="text-sm font-medium text-stone-700">Me interesa</label>
                  <div className="relative">
                    <select
                      id="interest"
                      value={form.interest}
                      onChange={(e) => setField('interest', e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all appearance-none text-base cursor-pointer"
                    >
                      {INTERESTS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-stone-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="space-count" className="block text-sm font-medium text-stone-700">{t('spacesCountLabel')}</label>
                  <p id="space-count-help" className="text-sm text-stone-500">{t('optional')}</p>
                  <input
                    type="number"
                    id="space-count"
                    min={1}
                    max={2147483647}
                    step={1}
                    inputMode="numeric"
                    value={form.spacesCount}
                    onChange={(e) => setField('spacesCount', e.target.value)}
                    onInvalid={() => setFieldErrors((current) => ({ ...current, spacesCount: t('spacesCountError') }))}
                    aria-invalid={Boolean(fieldErrors.spacesCount)}
                    aria-describedby={`space-count-help${fieldErrors.spacesCount ? ' space-count-error' : ''}`}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                    placeholder={t('spacesCountPlaceholder')}
                  />
                  {fieldErrors.spacesCount && <p id="space-count-error" role="alert" className="text-sm text-red-700">{fieldErrors.spacesCount}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="project-location" className="block text-sm font-medium text-stone-700">{t('locationLabel')}</label>
                  <p id="project-location-help" className="text-sm text-stone-500">{t('optional')}</p>
                  <input
                    type="text"
                    id="project-location"
                    maxLength={120}
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    aria-invalid={Boolean(fieldErrors.location)}
                    aria-describedby={`project-location-help${fieldErrors.location ? ' project-location-error' : ''}`}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-base"
                    placeholder={t('locationPlaceholder')}
                  />
                  {fieldErrors.location && <p id="project-location-error" role="alert" className="text-sm text-red-700">{fieldErrors.location}</p>}
                </div>

                <button
                  ref={submitRef}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 text-white font-semibold py-5 rounded-full hover:bg-stone-800 transition-all duration-300 shadow-lg hover:shadow-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>

                <p className="text-xs text-stone-400 text-center mt-4 font-light">
                  Al enviar aceptas nuestra política de privacidad.
                </p>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
      <ContactFeedbackModal status={feedback} onClose={() => setFeedback(null)} returnFocusRef={submitRef} />
    </section>
  );
}
