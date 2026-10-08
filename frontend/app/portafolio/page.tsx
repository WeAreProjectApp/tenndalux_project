'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { whatsappUrl } from '@/lib/whatsapp';
import { listPortfolioProjects, mediaUrl } from '@/lib/services/content';
import type { PortfolioProject } from '@/types/content';
import messages from './messages.json';

/**
 * Tarjeta del listado, con los nombres que ya usaba el diseño cuando los
 * proyectos estaban escritos a mano.
 */
type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  type: string;
  image: string;
  featured: boolean;
};

// Un proyecto sin galería cargada cae aquí en vez de dejar el hueco.
const FALLBACK_IMAGE = '/home/gallery/ejemplo-uso-general.webp';

function toCard(project: PortfolioProject): ProjectCard {
  return {
    id: String(project.id),
    slug: project.slug,
    title: project.title,
    category: project.categories[0]?.name ?? 'Proyecto',
    location: project.location,
    year: project.year ? String(project.year) : '',
    // El modelo no tiene un campo "tipo": los estilos cumplen ese papel.
    type: project.styles.map((style) => style.name).join(' + '),
    image: project.cover_image_url ? mediaUrl(project.cover_image_url) : FALLBACK_IMAGE,
    // `featured` sí existe en el modelo; si nadie marcó ninguno, encabeza el primero.
    featured: project.featured,
  };
}

const videoReels = [
  {
    id: 'v1',
    video: '/videos/optimized/IMG_5435.webm',
    title: 'Automatización en Acción',
    duration: '0:15',
  },
  {
    id: 'v2',
    video: '/videos/optimized/IMG_5455.webm',
    title: 'Instalación Paso a Paso',
    duration: '0:30',
  },
  {
    id: 'v3',
    video: '/videos/optimized/IMG_5457.webm',
    title: 'Transformación Completa',
    duration: '0:20',
  },
  {
    id: 'v4',
    video: '/videos/optimized/IMG_5458.webm',
    title: 'Antes y Después',
    duration: '0:18',
  },
  {
    id: 'v5',
    video: '/videos/optimized/IMG_8254.webm',
    title: 'Control por Voz',
    duration: '0:25',
  },
  {
    id: 'v6',
    video: '/videos/optimized/IMG_8262.webm',
    title: 'Cortinas Motorizadas',
    duration: '0:22',
  },
  {
    id: 'v7',
    video: '/videos/optimized/0728.webm',
    title: 'Proyecto Residencial',
    duration: '0:35',
  },
  {
    id: 'v8',
    video: '/videos/optimized/copy_F13631FA-5DF3-464F-A9C8-4825007CE471.webm',
    title: 'Acabados Premium',
    duration: '0:28',
  },
  {
    id: 'v9',
    video: '/videos/optimized/copy_E2BE92A7-75FE-4B1E-BF6A-C45DF45DB4CC.webm',
    title: 'Sistema Inteligente',
    duration: '0:32',
  },
  {
    id: 'v10',
    video: '/videos/optimized/copy_900C4A36-60AA-40EB-AE4C-77F6A3AB4E20.webm',
    title: 'Blackout Total',
    duration: '0:40',
  },
];


function PortfolioCatalogue() {
  const t = useTranslations('portfolioCatalogue');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<number>(0);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listPortfolioProjects()
      .then((data) => {
        if (cancelled) return;
        const cards = data.map(toCard);
        // Si nadie marcó un destacado en el admin, el primero hace de portada
        // para que la sección grande de arriba no quede vacía.
        if (cards.length && !cards.some((card) => card.featured)) {
          cards[0] = { ...cards[0], featured: true };
        }
        setProjects(cards);
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
    setProjects([]);
    setLoadAttempt((attempt) => attempt + 1);
  };

  const categories = ['Todos', ...Array.from(new Set(projects.map((p) => p.category)))];

  const featuredProject = projects.find(p => p.featured);
  const visibleFeaturedProject = selectedCategory === 'Todos' ? featuredProject : undefined;

  const filteredProjects = projects.filter(project => {
    return (selectedCategory === 'Todos' || project.category === selectedCategory)
      && project.id !== visibleFeaturedProject?.id;
  });

  const openVideoModal = (index: number) => {
    setSelectedVideo(index);
    setShowVideoModal(true);
  };

  const nextVideo = () => {
    setSelectedVideo((prev) => (prev + 1) % videoReels.length);
  };

  const prevVideo = () => {
    setSelectedVideo((prev) => (prev - 1 + videoReels.length) % videoReels.length);
  };

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
              Portafolio
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-stone-600 leading-relaxed">
              Proyectos residenciales, multifamiliares, comerciales, hoteleros e institucionales. Diseño, tecnología y funcionalidad en cada espacio.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-20 mb-16"
          >
            <div className="text-center">
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-2 text-stone-900">500+</p>
              <p className="text-sm font-medium text-stone-500">Proyectos Completados</p>
            </div>
            <div className="hidden sm:block w-px h-16 bg-stone-200" />
            <div className="text-center">
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-2 text-stone-900">15+</p>
              <p className="text-sm font-medium text-stone-500">Años de Experiencia</p>
            </div>
            <div className="hidden sm:block w-px h-16 bg-stone-200" />
            <div className="text-center">
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-2 text-stone-900">100%</p>
              <p className="text-sm font-medium text-stone-500">Satisfacción</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Showreel Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-stone-900">
              Nuestro Trabajo en Video
            </h2>
            <p className="text-lg text-stone-600">
              Reels cortos mostrando transformaciones y procesos
            </p>
          </motion.div>

          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 scrollbar-hide snap-x snap-mandatory">
            {videoReels.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 snap-center"
              >
                <button
                  type="button"
                  aria-label={t('openVideo', { title: video.title })}
                  onClick={() => openVideoModal(index)}
                  className="group relative w-[160px] sm:w-[200px] h-[284px] sm:h-[356px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <video
                    src={video.video}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md bg-white/30 group-hover:scale-110 transition-transform">
                      <svg style={{ width: '40px', height: '40px', marginLeft: '4px', color: '#FAFAF9' }} viewBox="0 0 24 24" fill="#FAFAF9">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                    <p className="text-sm font-semibold text-stone-50 mb-1">
                      {video.title}
                    </p>
                    <p className="text-xs text-stone-300">
                      {video.duration}
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
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
          </motion.div>
        </div>
      </section>

      {loading && (
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 animate-pulse" aria-label="Cargando proyectos">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
                <div className="h-4 w-2/3 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Project */}
      {visibleFeaturedProject && featuredProject && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link href={`/portafolio/${featuredProject.slug}`}>
                <div className="group relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500">
                  <Image
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 lg:p-16">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-stone-50 text-stone-900 font-semibold">
                        ⭐ Proyecto Destacado
                      </span>
                      <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-white/20 text-stone-50 font-medium">
                        {featuredProject.category}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-3 sm:mb-4 max-w-4xl text-stone-50 leading-[1.1]">
                      {featuredProject.title}
                    </h2>
                    
                    <p className="text-sm sm:text-lg mb-4 sm:mb-6 max-w-3xl text-stone-200">
                      {featuredProject.type}
                    </p>
                    
                    <div className="hidden sm:flex items-center gap-6 text-sm text-stone-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span>{featuredProject.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>{featuredProject.year}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto group-hover:gap-4 transition-all">
                        <span className="font-semibold text-stone-50">Ver proyecto</span>
                        <ArrowRight className="w-5 h-5 text-stone-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Projects Grid */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: compact horizontal cards */}
          <div className="sm:hidden space-y-3">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/portafolio/${project.slug}`}>
                  <article className="group bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform border border-stone-100">
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] backdrop-blur-md bg-white/90 text-stone-900 font-semibold">
                            {project.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="text-sm font-semibold text-stone-900 mb-1 leading-tight line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-xs text-stone-500 mb-1.5">{project.type}</p>
                        <div className="flex items-center gap-3 text-[10px] text-stone-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{project.year}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop: original grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/portafolio/${project.slug}`}>
                  <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-white/90 text-stone-900 font-semibold">
                          {project.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 mb-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{project.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{project.year}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-semibold mb-3 group-hover:text-stone-600 transition-colors leading-tight">
                        {project.title}
                      </h3>
                      
                      <p className="text-base mb-6 flex-1 text-stone-500 leading-relaxed">
                        {project.type}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-stone-900 font-semibold group-hover:gap-4 transition-all">
                        <span>Ver proyecto</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {loadError && (
            <div role="alert" className="text-center py-12">
              <p className="text-lg mb-4 text-stone-600">{t('loadError')}</p>
              <button onClick={retryLoad} className="px-6 py-3 rounded-full bg-stone-900 text-stone-50 font-semibold">
                {t('retry')}
              </button>
            </div>
          )}
          {!loading && !loadError && !visibleFeaturedProject && filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-2xl mb-4 text-stone-500 font-medium">
                No hay proyectos en esta categoría aún
              </p>
              <button
                onClick={() => setSelectedCategory('Todos')}
                className="text-sm font-semibold text-stone-900 hover:opacity-60 transition-opacity"
              >
                Ver todos los proyectos
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
              ¿Tu Proyecto Será el Próximo?
            </h2>
            <p className="text-xl mb-10 text-stone-300 leading-relaxed">
              Agenda una consultoría gratuita y hagamos realidad tu visión
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
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
                <svg className="w-5 h-5" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6"/>
                </svg>
                <span className="text-base sm:text-lg font-medium">WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('videoDialog')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <button
              aria-label={t('closeVideo')}
              onClick={() => setShowVideoModal(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-6 h-6 text-stone-50" />
            </button>

            <button
              aria-label={t('previousVideo')}
              onClick={(e) => { e.stopPropagation(); prevVideo(); }}
              className="absolute left-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8 text-stone-50" />
            </button>

            <button
              aria-label={t('nextVideo')}
              onClick={(e) => { e.stopPropagation(); nextVideo(); }}
              className="absolute right-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8 text-stone-50" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[400px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl"
            >
              <video
                key={videoReels[selectedVideo].id}
                data-testid="portfolio-showreel-video"
                src={videoReels[selectedVideo].video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-lg font-semibold text-stone-50 mb-2">
                  {videoReels[selectedVideo].title}
                </p>
                <p className="text-sm text-stone-300">
                  {videoReels[selectedVideo].duration} • {selectedVideo + 1} / {videoReels.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Portafolio() {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><PortfolioCatalogue /></NextIntlClientProvider>;
}
