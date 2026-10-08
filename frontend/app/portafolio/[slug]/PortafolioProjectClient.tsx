'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from './messages';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Calendar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BlockRenderer from '@/components/content/BlockRenderer';
import { getPortfolioProject } from '@/lib/services/content';
import { whatsappUrl } from '@/lib/whatsapp';
import type { PortfolioProject } from '@/types/content';

/** Ver la nota en app/blog/[slug]/BlogPostClient.tsx: una plantilla, todos los slugs. */
function slugFromPath(): string {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export default function PortafolioProjectClient() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota">
      <PortfolioDetail />
    </NextIntlClientProvider>
  );
}

function PortfolioDetail() {
  const t = useTranslations('detail');
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'unavailable'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let titleObserver: MutationObserver | undefined;
    const routePath = window.location.pathname;

    getPortfolioProject(slugFromPath())
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setState('ready');
        const title = `${data.title} — Tenndalux`;
        const keepTitle = () => {
          if (!cancelled && window.location.pathname === routePath && document.title !== title) {
            document.title = title;
          }
        };
        keepTitle();
        titleObserver = new MutationObserver(keepTitle);
        titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(isAxiosError(error) && error.response?.status === 404 ? 'missing' : 'unavailable');
        }
      });

    return () => {
      cancelled = true;
      titleObserver?.disconnect();
    };
  }, [attempt]);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Header />

      <div className="pt-24 sm:pt-28 pb-6 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/portafolio"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Portafolio
          </Link>
        </div>
      </div>

      {state === 'loading' && (
        <div className="px-4 sm:px-6 pb-32">
          <div className="max-w-4xl mx-auto animate-pulse space-y-6" aria-label="Cargando el proyecto">
            <div className="h-12 w-3/4 bg-stone-200 rounded" />
            <div className="h-64 bg-stone-200 rounded-2xl" />
          </div>
        </div>
      )}

      {state === 'unavailable' && (
        <div role="alert" className="px-4 sm:px-6 pb-32 text-center">
          <h1 className="text-3xl font-semibold text-stone-900 mb-4">{t('unavailable')}</h1>
          <p className="text-stone-600 mb-8">{t('explanation')}</p>
          <button type="button" onClick={() => {
            setState('loading');
            setAttempt((value) => value + 1);
          }} className="px-8 py-4 rounded-full bg-stone-900 text-stone-50 font-semibold">
            {t('retry')}
          </button>
        </div>
      )}

      {state === 'missing' && (
        <div className="px-4 sm:px-6 pb-32 text-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 mb-4">
              No encontramos este proyecto
            </h1>
            <p className="text-stone-600 mb-8">
              Puede que lo hayamos movido o que aún no esté publicado.
            </p>
            <Link
              href="/portafolio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-stone-900 text-stone-50 font-semibold"
            >
              Ver todos los proyectos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {state === 'ready' && project && (
        <article>
          <header className="px-4 sm:px-6 pb-8 sm:pb-12">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-500 mb-6 sm:mb-8">
                  {project.location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {project.location}
                    </span>
                  )}
                  {project.year && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {project.year}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 sm:mb-8 tracking-tight leading-[1.05] text-stone-900">
                  {project.title}
                </h1>

                {project.description && (
                  <p className="text-lg sm:text-xl md:text-2xl text-stone-600 leading-relaxed pb-8 sm:pb-10 border-b border-stone-200">
                    {project.description}
                  </p>
                )}
              </motion.div>
            </div>
          </header>

          <div className="px-4 sm:px-6 pb-14 sm:pb-20">
            <div className="max-w-3xl mx-auto">
              <BlockRenderer blocks={project.content_blocks} />

              <div className="mt-12 sm:mt-16 bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-100 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 text-stone-900">
                  ¿Quieres algo así en tu espacio?
                </h2>
                <p className="text-base sm:text-lg mb-6 sm:mb-8 text-stone-600 leading-relaxed">
                  Agenda una asesoría y lo revisamos contigo sin compromiso.
                </p>
                <a
                  href={whatsappUrl(`un proyecto como ${project.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 sm:px-10 py-4 sm:py-5 rounded-full inline-flex items-center justify-center gap-3 transition-all hover:scale-105 bg-stone-900 text-stone-50"
                >
                  <span className="text-base sm:text-lg font-semibold">Agendar Consultoría</span>
                  <ArrowRight className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </article>
      )}

      <Footer />
    </div>
  );
}
