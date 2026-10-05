'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Image from 'next/image';
import { PlayIcon } from '@heroicons/react/24/solid';
import VideoModal from '@/components/ui/VideoModal';

gsap.registerPlugin(ScrollTrigger);

type GalleryItem = {
  type: 'image' | 'video';
  src: string;
  alt: string;
  className: string;
  videoSrc?: string;
  /** Primer fotograma. Sin él la tarjeta es un rectángulo negro hasta que el
   *  clip entra en pantalla y empieza a cargar. */
  poster?: string;
};

const galleryItems: GalleryItem[] = [
  {
    type: 'image',
    src: '/home/gallery/cortina-ondessence.webp',
    alt: 'Cortina Ondessence ondas de lujo',
    className: 'row-span-2'
  },
  {
    type: 'video',
    src: '/videos/optimized/c56462c7c6fd441d8cebe16d51ee5336.webm',
    videoSrc: '/videos/optimized/c56462c7c6fd441d8cebe16d51ee5336.webm',
    alt: 'Instalación de cortinas motorizadas',
    className: 'row-span-2'
  },
  {
    type: 'image',
    src: '/home/gallery/cortina-classic.webp',
    alt: 'Cortina Classic elegante',
    className: 'row-span-1'
  },
  {
    type: 'image',
    src: '/home/gallery/enrollable-screen.webp',
    alt: 'Enrollable screen premium',
    className: 'row-span-2'
  },
  {
    type: 'image',
    src: '/home/gallery/ejemplo-uso-general.webp',
    alt: 'Ambiente decorado con cortinas de lujo',
    className: 'row-span-2'
  },
  {
    type: 'image',
    src: '/home/gallery/cortina-celular-blackout.webp',
    alt: 'Cortina celular tejido blackout',
    className: 'row-span-1'
  },
  // Proyectos reales. `src` es un clip de 7s sin audio que se reproduce solo en
  // la grilla; `videoSrc` es el video completo que abre la modal. Separarlos
  // evita que entrar al home descargue varios minutos de video.
  {
    type: 'video',
    src: '/videos/proyectos/proyecto-1-clip.webm',
    videoSrc: '/videos/proyectos/proyecto-1.webm',
    poster: '/videos/proyectos/proyecto-1-poster.webp',
    alt: 'Proyecto 1 — instalación de cortinas',
    className: 'row-span-2'
  },
  {
    type: 'video',
    src: '/videos/proyectos/proyecto-2-clip.webm',
    videoSrc: '/videos/proyectos/proyecto-2.webm',
    poster: '/videos/proyectos/proyecto-2-poster.webp',
    alt: 'Proyecto 2 — instalación de cortinas',
    className: 'row-span-2'
  },
  {
    type: 'video',
    src: '/videos/proyectos/proyecto-3-clip.webm',
    videoSrc: '/videos/proyectos/proyecto-3.webm',
    poster: '/videos/proyectos/proyecto-3-poster.webp',
    alt: 'Proyecto 3 — instalación de cortinas',
    className: 'row-span-2'
  },
  {
    type: 'video',
    src: '/videos/proyectos/proyecto-4-clip.webm',
    videoSrc: '/videos/proyectos/proyecto-4.webm',
    poster: '/videos/proyectos/proyecto-4-poster.webp',
    alt: 'Proyecto 4 — instalación de cortinas',
    className: 'row-span-2'
  },
  {
    type: 'video',
    src: '/videos/proyectos/proyecto-5-clip.webm',
    videoSrc: '/videos/proyectos/proyecto-5.webm',
    poster: '/videos/proyectos/proyecto-5-poster.webp',
    alt: 'Proyecto 5 — instalación de cortinas',
    className: 'row-span-2'
  }
];

/**
 * Clip de la grilla: sólo se reproduce mientras está a la vista.
 *
 * Con seis videos en la sección, dejarlos todos con `autoPlay` haría que el
 * navegador decodifique seis a la vez aunque cinco estén fuera de pantalla, y
 * `preload="none"` evita bajar los 4.8 MB de clips al abrir el home.
 */
function GalleryVideo({ item }: { item: GalleryItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Algunos navegadores bloquean el autoplay: queda el primer frame,
            // y el botón de reproducir sigue abriendo el video completo.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      poster={item.poster}
      aria-label={item.alt}
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src={item.src} type="video/webm" />
    </video>
  );
}

export default function Gallery() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Apple-style blur reveal for header
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 60, filter: 'blur(15px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.2, ease: 'power4.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 85%' }
        }
      );

      if (gridRef.current) {
        gsap.fromTo(gridRef.current,
          { opacity: 0, y: 50, filter: 'blur(10px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1, ease: 'power4.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 82%' }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const GalleryCard = ({ item }: { item: GalleryItem }) => (
    <div
      data-testid={item.type === 'video' ? 'gallery-video-card' : undefined}
      className={`relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl group ${item.type === 'video' ? 'cursor-pointer' : ''}`}
      onClick={() => item.type === 'video' && item.videoSrc && setSelectedVideo(item.videoSrc)}
    >
      {item.type === 'image' ? (
        <>
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 85vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </>
      ) : (
        <div className="relative w-full h-full">
          <GalleryVideo item={item} />
          {/* En escritorio el botón sólo aparece al pasar el mouse, para no tapar
              el clip. En táctil no hay hover, así que ahí queda siempre visible. */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 sm:bg-transparent sm:group-hover:bg-black/25">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transition-all duration-300 sm:opacity-0 sm:scale-90 sm:group-hover:opacity-100 sm:group-hover:scale-100">
              <PlayIcon className="w-7 h-7 md:w-10 md:h-10 text-stone-900 ml-0.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <section ref={sectionRef} className="py-20 md:py-36 bg-stone-50">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12">
          <div ref={headerRef} className="text-center mb-10 md:mb-28 space-y-4 md:space-y-6">
            <span className="text-sm sm:text-base font-semibold text-stone-400 tracking-[0.2em] uppercase">Proyectos Reales</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
              Espacios que inspiran
            </h2>
            <p className="text-lg md:text-2xl text-stone-600 max-w-3xl mx-auto font-light">
              Proyectos residenciales, comerciales y hoteleros transformados con diseño, tecnología y precisión.
            </p>
          </div>

          <div ref={gridRef}>
            {/* Mobile: Swiper carousel */}
            <div className="sm:hidden">
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={12}
                slidesPerView={1.15}
                centeredSlides={true}
                loop={false}
                rewind={true}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                className="gallery-swiper !pb-10"
              >
                {galleryItems.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative aspect-[3/4]">
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <GalleryCard item={item} />
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 auto-rows-[250px] sm:auto-rows-[350px] grid-flow-dense">
              {galleryItems.map((item, index) => (
                <div key={index} className={`relative ${item.className}`}>
                  <GalleryCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoSrc={selectedVideo || ''}
      />
    </>
  );
}
