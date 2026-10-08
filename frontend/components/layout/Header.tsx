'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from './header.messages.json';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const subscribeToHydration = () => () => {};

export default function Header() {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><HeaderContent /></NextIntlClientProvider>;
}

function HeaderContent() {
  const t = useTranslations('Header');
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  // When on home and not scrolled, use light (white) style
  const isLight = isHome && !hasScrolled;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const ctaBtnRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const navItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Portafolio', href: '/portafolio' },
    { label: 'Blog', href: '/blog' },
  ];

  // Scroll detection for header blur/bg
  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // GSAP full-screen overlay animation
  useEffect(() => {
    if (!overlayRef.current) return;

    if (isMenuOpen) {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tlRef.current = tl;

      tl.set(overlayRef.current, { display: 'flex' })
        .fromTo(overlayRef.current,
          { clipPath: 'circle(0% at calc(100% - 40px) 36px)' },
          { clipPath: 'circle(150% at calc(100% - 40px) 36px)', duration: 0.8 }
        )
        .fromTo(
          navLinksRef.current.filter(Boolean),
          { y: 80, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.08 },
          '-=0.4'
        )
        .fromTo(ctaBtnRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(socialRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          '-=0.2'
        );
      return () => { tl.kill(); };
    } else {
      if (tlRef.current) {
        tlRef.current.kill();
      }
      const tl = gsap.timeline({
        defaults: { ease: 'power3.in' },
        onComplete: () => {
          if (overlayRef.current) {
            gsap.set(overlayRef.current, { display: 'none' });
          }
        }
      });
      tlRef.current = tl;
      tl.to(navLinksRef.current.filter(Boolean), {
        y: -30, opacity: 0, filter: 'blur(6px)', duration: 0.25, stagger: 0.03
      })
      .to(overlayRef.current, {
        clipPath: 'circle(0% at calc(100% - 40px) 36px)', duration: 0.5
      }, '-=0.1');
      return () => { tl.kill(); };
    }
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
      if (event.key !== 'Tab') return;
      const controls = overlayRef.current?.querySelectorAll<HTMLElement>('a[href], button');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      const outside = !overlayRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault(); first.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onDesktop = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener('change', onDesktop);
    document.addEventListener('keydown', onKeyDown);
    onDesktop();
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', onDesktop);
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      {/* Floating header with glassmorphism */}
      <header
        role="banner"
        inert={isMenuOpen}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          hasScrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_30px_rgba(0,0,0,0.06)] border-b border-stone-200/40'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-[72px] sm:h-20">
            <Link
              href="/"
              className="z-[60] block"
            >
              <Image
                src="/logo-tenndalux.webp"
                alt="Tenndalux"
                width={200}
                height={50}
                className={`h-20 sm:h-24 w-auto transition-all duration-300 ${
                  isLight ? 'brightness-0 invert' : ''
                }`}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-12">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex min-h-11 min-w-11 items-center justify-center transition-colors duration-300 text-[15px] font-medium after:absolute after:bottom-[8px] after:left-0 after:w-0 after:h-[1.5px] after:transition-all after:duration-300 hover:after:w-full ${
                    isLight
                      ? 'text-white/80 hover:text-white after:bg-white'
                      : 'text-stone-500 hover:text-stone-900 after:bg-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="#contacto"
                className={`hidden lg:flex px-8 py-3 rounded-full font-medium text-sm transition-all duration-300 items-center gap-2.5 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white/15 text-white border border-white/30 hover:bg-white/25 hover:shadow-lg hover:shadow-white/10'
                    : 'bg-stone-900 text-stone-50 hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/10'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-[18px] h-[18px]" />
                <span>Contáctanos</span>
              </Link>

              {/* Hamburger / Close — always visible on mobile */}
              <button
                ref={triggerRef}
                disabled={!isHydrated}
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="public-navigation-menu"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`lg:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200 z-[60] relative ${
                  isLight ? 'text-white hover:bg-white/10' : 'text-stone-700 hover:bg-stone-100/60'
                }`}
                aria-label={t('toggle')}
              >
                <div className="w-6 h-6 flex flex-col items-center justify-center gap-[5px]">
                  <span
                    className={`block h-[2px] w-6 rounded-full transition-all duration-500 origin-center ${
                      isLight ? 'bg-white' : 'bg-stone-800'
                    } ${
                      isMenuOpen ? 'rotate-45 translate-y-[3.5px]' : ''
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-6 rounded-full transition-all duration-500 origin-center ${
                      isLight ? 'bg-white' : 'bg-stone-800'
                    } ${
                      isMenuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Full-screen overlay menu — ProjectApp style */}
      <div
        ref={overlayRef}
        id="public-navigation-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t('navigation')}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
        data-testid="public-navigation-menu"
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest('a, button')) closeMenu();
        }}
        className="fixed inset-0 z-[70] flex-col overflow-y-auto bg-white"
        style={{ display: 'none', clipPath: 'circle(0% at calc(100% - 40px) 36px)' }}
      >
        {/* Top bar inside overlay mirrors main header */}
        <div className="flex items-center justify-between h-[72px] sm:h-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto w-full">
          <Link href="/" onClick={closeMenu} className="block" data-testid="mobile-menu-logo-link">
            <Image
              src="/logo-tenndalux.webp"
              alt="Tenndalux"
              width={200}
              height={50}
              className="h-20 sm:h-24 w-auto"
            />
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={closeMenu}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100/60 transition-colors duration-200"
            aria-label={t('close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links — large display titles */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 max-w-[1400px] mx-auto w-full">
          <div className="space-y-0">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                ref={(el) => { navLinksRef.current[i] = el; }}
                href={item.href}
                onClick={closeMenu}
                className="block text-[clamp(2.5rem,8vw,4.5rem)] font-semibold text-stone-900 leading-[1.15] py-4 border-b border-stone-200/60 hover:text-stone-500 transition-colors duration-300 tracking-tight"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom: CTA + Social */}
        <div className="px-8 sm:px-12 pb-10 max-w-[1400px] mx-auto w-full space-y-6">
          <div ref={ctaBtnRef}>
            <Link
              href="#contacto"
              onClick={closeMenu}
              className="flex items-center justify-center gap-3 bg-stone-900 text-stone-50 py-5 rounded-2xl font-semibold text-lg hover:bg-stone-800 transition-all duration-300 w-full"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Contáctanos</span>
            </Link>
          </div>
          <div ref={socialRef} className="flex items-center justify-center gap-8 text-sm text-stone-400 font-medium">
            <a href="https://instagram.com/tenndalux" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-stone-700 transition-colors">Instagram</a>
            <a href="https://facebook.com/tenndalux" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-stone-700 transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </>
  );
}
