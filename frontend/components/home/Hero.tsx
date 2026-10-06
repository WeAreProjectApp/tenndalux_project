'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { whatsappUrl } from '@/lib/whatsapp';
import { getHomeContent } from '@/lib/services/site';
import { mediaUrl } from '@/lib/services/content';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const defaultImage = '/home/hero-background.webp';
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getHomeContent().then((content) => {
      if (active && content.hero_image_url) {
        setImageUrl(mediaUrl(content.hero_image_url));
      }
    }).catch(() => { /* Keep the default cover if the API is unavailable. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        delay: 0.2,
      });

      // Apple-style blur reveal: heading
      tl.fromTo(headingRef.current,
        { y: 100, opacity: 0, filter: 'blur(20px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4 }
      )
      // Subtitle fade blur
      .fromTo(subtitleRef.current,
        { y: 40, opacity: 0, filter: 'blur(12px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1 },
        '-=0.9'
      )
      // CTA buttons
      .fromTo(ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.6'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center pt-28 sm:pt-40 pb-20 sm:pb-32 overflow-hidden"
    >
      {/* Background image */}
      <Image
        src={imageUrl}
        alt=""
        fill
        priority
        className="object-cover object-center"
        onError={() => setImageUrl(defaultImage)}
        data-testid="hero-image"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 sm:px-8 lg:px-16 w-full">
        <div className="max-w-[700px] space-y-10">
          <h1
            ref={headingRef}
            className="text-[36px] sm:text-[48px] md:text-[60px] lg:text-[72px] font-bold text-white leading-[1.08] tracking-tight will-change-transform"
            style={{ opacity: 0 }}
          >
            Tu espacio no solo<br />se estrena.<br />
            <em className="font-bold italic">Se diseña.</em>
          </h1>
          <p
            ref={subtitleRef}
            className="text-lg md:text-xl text-white/85 leading-relaxed max-w-[500px] font-light will-change-transform"
            style={{ opacity: 0 }}
          >
            Cortinas inteligentes, control solar exterior y soluciones que integran diseño y tecnología para transformar la manera de vivir tus espacios.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-5 pt-4" style={{ opacity: 0 }}>
            <a
              href={whatsappUrl('agendar una asesoría')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-stone-900 text-stone-50 px-8 sm:px-12 py-4 sm:py-5 rounded-full font-semibold text-base sm:text-lg hover:bg-stone-800 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              <span>Agenda una asesoría</span>
              <ArrowRightIcon className="w-5 h-5" />
            </a>

            <Link
              href="#proyectos"
              className="inline-flex items-center justify-center gap-3 bg-stone-900/80 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full font-semibold text-base sm:text-lg border border-white/20 hover:bg-stone-900 transition-all duration-300"
            >
              <span>Explorar Proyectos</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
