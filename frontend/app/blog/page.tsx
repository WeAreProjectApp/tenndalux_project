'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Search, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { whatsappUrl } from '@/lib/whatsapp';
import { listBlogPosts, mediaUrl } from '@/lib/services/content';
import type { BlogPost } from '@/types/content';
import messages from './messages.json';

/**
 * Tarjeta del listado. Los nombres son los que ya usaba el diseño cuando los
 * posts estaban escritos a mano; el mapeo desde la API los conserva para no
 * reescribir el JSX.
 */
type BlogCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
};

// Un post sin portada cargada en el admin cae aquí en vez de dejar el hueco.
const FALLBACK_IMAGE = '/home/gallery/cortina-ondessence.webp';

function toCard(post: BlogPost, index: number): BlogCard {
  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    image: post.cover_image_url ? mediaUrl(post.cover_image_url) : FALLBACK_IMAGE,
    // La primera etiqueta hace de categoría: el modelo no tiene ese campo.
    category: post.tags[0]?.name ?? 'General',
    date: post.published_at || post.created_at,
    readTime: `${post.read_time_minutes} min`,
    // El más reciente encabeza el listado. Tampoco hay campo "destacado".
    featured: index === 0,
  };
}

function BlogCatalogue() {
  const t = useTranslations('blogCatalogue');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listBlogPosts()
      .then((posts) => {
        if (!cancelled) setBlogPosts(posts.map(toCard));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [loadAttempt]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError(false);
    setBlogPosts([]);
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Las categorías salen de las etiquetas que realmente tienen los posts.
  const categories = ['Todos', ...Array.from(new Set(blogPosts.map((post) => post.category)))];

  const featuredPost = blogPosts.find(post => post.featured);
  const visibleFeaturedPost = selectedCategory === 'Todos' && !searchQuery ? featuredPost : undefined;

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && post.id !== visibleFeaturedPost?.id;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold mb-6 tracking-tight leading-[1.05] text-stone-900">
              Blog
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-stone-600 leading-relaxed">
              Tendencias, guías y consejos expertos sobre diseño de interiores 
              y soluciones de control solar
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  aria-label={t('search')}
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-stone-200 focus:outline-none focus:border-stone-900 transition-all text-lg bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all hover:scale-105 border-2 text-sm sm:text-base ${
                    selectedCategory === category 
                      ? 'bg-stone-900 text-stone-50 border-stone-900 font-semibold' 
                      : 'bg-white text-stone-600 border-stone-200 font-medium hover:border-stone-400'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {loading && (
            <div className="grid md:grid-cols-3 gap-8 animate-pulse" aria-label="Cargando artículos">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
                  <div className="h-4 w-2/3 bg-stone-200 rounded" />
                  <div className="h-4 w-1/2 bg-stone-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Featured Post */}
          {visibleFeaturedPost && featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-20"
            >
              <Link href={`/blog/${featuredPost.slug}`}>
                <div className="group relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500">
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 lg:p-16">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-stone-50 text-stone-900 font-semibold">
                        ⭐ Destacado
                      </span>
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-white/20 text-stone-50 font-medium">
                        {featuredPost.category}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 sm:mb-6 max-w-4xl text-stone-50 leading-[1.1]">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-sm sm:text-lg md:text-xl mb-4 sm:mb-8 max-w-3xl text-stone-200 leading-relaxed hidden sm:block">
                      {featuredPost.excerpt}
                    </p>
                    
                    <div className="hidden sm:flex items-center gap-6 text-sm text-stone-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(featuredPost.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{featuredPost.readTime} de lectura</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto group-hover:gap-4 transition-all">
                        <span className="font-semibold text-stone-50">Leer artículo</span>
                        <ArrowRight className="w-5 h-5 text-stone-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Blog Grid */}
          {/* Mobile: compact horizontal cards */}
          <div className="sm:hidden space-y-3">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <article className="group bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform border border-stone-100">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] backdrop-blur-md bg-white/90 text-stone-900 font-semibold">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                        <h3 className="text-sm font-semibold text-stone-900 mb-1 leading-tight line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mb-1.5 flex-1">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-[10px] text-stone-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop: original grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-white/90 text-stone-900 font-semibold">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 mb-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-stone-600 transition-colors leading-tight">
                        {post.title}
                      </h3>
                      
                      <p className="text-base mb-6 flex-1 text-stone-500 leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-stone-900 font-semibold group-hover:gap-4 transition-all">
                        <span>Leer más</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {loadError && (
            <div role="alert" className="text-center py-12">
              <p className="text-lg mb-4 text-stone-600">{t('loadError')}</p>
              <button onClick={retryLoad} className="px-6 py-3 rounded-full bg-stone-900 text-stone-50 font-semibold">
                {t('retry')}
              </button>
            </div>
          )}
          {!loading && !loadError && !visibleFeaturedPost && filteredPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-2xl mb-4 text-stone-500 font-medium">
                No encontramos artículos con esos criterios
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todos');
                }}
                className="text-sm font-semibold text-stone-900 hover:opacity-60 transition-opacity"
              >
                Limpiar filtros
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-stone-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-stone-50">
              ¿Tienes un Proyecto en Mente?
            </h2>
            <p className="text-xl mb-10 text-stone-300 leading-relaxed">
              Agenda una consultoría gratuita y descubre cómo transformar tu espacio
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={whatsappUrl('agendar una consultoría')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 sm:px-10 py-4 sm:py-5 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 bg-stone-50 text-stone-900"
              >
                <span className="text-base sm:text-lg font-semibold">Agendar Consultoría</span>
                <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href={whatsappUrl('agendar una consultoría')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 sm:px-10 py-4 sm:py-5 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 border-2 border-stone-50 text-stone-50"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-base sm:text-lg font-medium">WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

<Footer />
    </div>
  );
}

export default function Blog() {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><BlogCatalogue /></NextIntlClientProvider>;
}
