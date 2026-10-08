'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from './messages';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Share2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BlockRenderer from '@/components/content/BlockRenderer';
import { getBlogPost, mediaUrl } from '@/lib/services/content';
import { whatsappUrl } from '@/lib/whatsapp';
import type { BlogPost } from '@/types/content';

/**
 * El export estático genera UNA sola plantilla para /blog/[slug]/, y Django la
 * sirve para cualquier slug. Por eso el slug se lee de la URL en el navegador y
 * no de los params del build: en el build sólo existe el slug de la plantilla.
 */
function slugFromPath(): string {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export default function BlogPostClient() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota">
      <BlogPostDetail />
    </NextIntlClientProvider>
  );
}

function BlogPostDetail() {
  const t = useTranslations('detail');
  const [post, setPost] = useState<BlogPost | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'unavailable'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getBlogPost(slugFromPath())
      .then((data) => {
        if (cancelled) return;
        setPost(data);
        setState('ready');
        // El <title> del shell es genérico hasta que se sabe qué post es.
        document.title = data.meta_title || `${data.title} — Tenndalux`;
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(isAxiosError(error) && error.response?.status === 404 ? 'missing' : 'unavailable');
        }
      });

    return () => { cancelled = true; };
  }, [attempt]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title ?? document.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Browser integrations may be cancelled or denied; keep the article usable.
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Header />

      <div className="pt-24 sm:pt-28 pb-6 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Blog
          </Link>
        </div>
      </div>

      {state === 'loading' && (
        <div className="px-4 sm:px-6 pb-32">
          <div className="max-w-4xl mx-auto animate-pulse space-y-6" aria-label="Cargando el artículo">
            <div className="h-4 w-32 bg-stone-200 rounded" />
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
              No encontramos este artículo
            </h1>
            <p className="text-stone-600 mb-8">
              Puede que lo hayamos movido o que aún no esté publicado.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-stone-900 text-stone-50 font-semibold"
            >
              Ver todos los artículos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {state === 'ready' && post && (
        <article>
          <title>{post.meta_title || `${post.title} — Tenndalux`}</title>
          <header className="px-4 sm:px-6 pb-8 sm:pb-12">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {post.published_at && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 mb-6 sm:mb-8">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span suppressHydrationWarning>
                      {new Date(post.published_at).toLocaleDateString('es-CO', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 sm:mb-8 tracking-tight leading-[1.05] text-stone-900">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 text-stone-600 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-end pb-8 sm:pb-10 border-b border-stone-200">
                  <button
                    onClick={handleShare}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105 border-2 border-stone-200 text-stone-900"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm font-medium">Compartir</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </header>

          {post.cover_image_url && (
            <div className="px-4 sm:px-6 mb-10 sm:mb-16">
              <div className="max-w-6xl mx-auto">
                <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={mediaUrl(post.cover_image_url)}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-6 pb-14 sm:pb-20">
            <div className="max-w-3xl mx-auto">
              <BlockRenderer blocks={post.content_blocks} />

              <div className="mt-12 sm:mt-16 bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-100 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 text-stone-900">
                  ¿Te Inspiró Este Artículo?
                </h2>
                <p className="text-base sm:text-lg mb-6 sm:mb-8 text-stone-600 leading-relaxed">
                  Hablemos de tu proyecto. Agenda una consultoría gratuita sin compromiso.
                </p>
                <a
                  href={whatsappUrl('agendar una consultoría')}
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
