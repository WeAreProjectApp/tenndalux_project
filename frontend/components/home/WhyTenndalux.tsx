'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayIcon } from '@heroicons/react/24/solid';
import { 
  SparklesIcon, 
  CpuChipIcon, 
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from './videoTriggers.messages.json';
import VideoModal from '@/components/ui/VideoModal';
import { whatsappUrl } from '@/lib/whatsapp';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    icon: SparklesIcon,
    title: 'Sin cables visibles',
    description: 'Sistemas que se integran de forma limpia y elegante a tu arquitectura.'
  },
  {
    icon: CpuChipIcon,
    title: 'Sin ruido',
    description: 'Motores ultra silenciosos de última generación. Operación imperceptible.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Sin improvisaciones',
    description: 'Motores con 5 años de garantía. Soporte técnico y postventa confiable.'
  },
  {
    icon: UserGroupIcon,
    title: 'Integración inteligente',
    description: 'Compatible con Alexa, Google Home, IFTTT y SmartThings. App gratuita.'
  },
];

const VIDEO_SRC = '/videos/optimized/copy_429DCD28-111F-43D8-BC3D-9277828BFA0D.webm';

export default function WhyTenndalux() {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><WhyTenndaluxContent /></NextIntlClientProvider>;
}

function WhyTenndaluxContent() {
  const t = useTranslations('VideoTriggers');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Apple-style blur reveal
      gsap.fromTo(videoRef.current,
        { opacity: 0, scale: 0.9, filter: 'blur(15px)' },
        {
          opacity: 1, scale: 1, filter: 'blur(0px)',
          duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
        }
      );

      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 70, filter: 'blur(12px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.3, delay: 0.15, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
        }
      );

      // Subtle parallax on video
      gsap.to(videoRef.current, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section ref={sectionRef} className="py-20 md:py-36 bg-stone-900 text-white overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">
            {/* Left: Video */}
            <div ref={videoRef} className="relative">
              <button
                type="button"
                aria-label={t('brand')}
                className="relative block w-full aspect-[9/16] max-w-[380px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer group"
                onClick={() => setIsVideoOpen(true)}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={VIDEO_SRC} type="video/webm" />
                </video>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <PlayIcon className="w-10 h-10 text-stone-900 ml-1" />
                  </div>
                </div>
              </button>

              {/* Decorative */}
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-gradient-to-br from-stone-700 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
            </div>

            {/* Right: Content */}
            <div ref={contentRef} className="space-y-16">
              <div className="space-y-8">
                <span className="text-base font-semibold text-stone-400 tracking-[0.25em] uppercase">
                  Lujo Silencioso
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                  La diferencia está<br />
                  <span className="text-stone-400">en lo que no se ve</span>
                </h2>
                <p className="text-xl md:text-2xl text-stone-300 font-light leading-relaxed max-w-xl">
                  En Tenndalux diseñamos sistemas que se integran de forma limpia y elegante a tu arquitectura. Sin cables visibles. Sin ruido. Sin improvisaciones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center">
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                      <p className="text-stone-400 text-base leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={whatsappUrl('agendar una asesoría gratis')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-4 bg-white text-stone-900 px-10 sm:px-16 py-5 sm:py-6 rounded-full font-bold text-base sm:text-lg hover:bg-stone-100 transition-all duration-300 shadow-xl"
              >
                <svg className="w-6 h-6" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6"/>
                </svg>
                Solicitar Asesoría Gratis
              </a>
            </div>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoSrc={VIDEO_SRC}
        title="Cortinas motorizadas Tenndalux"
      />
    </>
  );
}
