'use client';

import Link from 'next/link';
import Image from 'next/image';
// Icons are inline SVGs to avoid extra dependencies for now, or use @heroicons/react


export default function Footer() {
  return (
    <footer className="bg-stone-950 text-white pt-24 pb-12 border-t border-stone-900" data-testid="site-footer">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Image
              src="/logo-tenndalux.webp"
              alt="Tenndalux"
              width={160}
              height={40}
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="text-stone-400 font-light leading-relaxed">
              Cortinas, automatización y soluciones que combinan diseño, tecnología y precisión para transformar tus espacios.
            </p>
            <div className="flex gap-4 pt-2">
              {/* Social Icons (SVGs) */}
              <a href="https://www.instagram.com/tenndalux" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                 <span className="sr-only">Instagram</span>
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.facebook.com/tenndalux" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                 <span className="sr-only">Facebook</span>
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@tenndalux" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                 <span className="sr-only">TikTok</span>
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="https://www.youtube.com/@tenndalux" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                 <span className="sr-only">YouTube</span>
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Explorar</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-stone-400 hover:text-white transition-colors font-light">Inicio</Link></li>
              <li><Link href="/servicios" className="text-stone-400 hover:text-white transition-colors font-light">Servicios</Link></li>
              <li><Link href="/portafolio" className="text-stone-400 hover:text-white transition-colors font-light">Portafolio</Link></li>
              <li><Link href="/blog" className="text-stone-400 hover:text-white transition-colors font-light">Blog</Link></li>
              <li><Link href="#contacto" className="text-stone-400 hover:text-white transition-colors font-light">Contacto</Link></li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><a href="/legal/terminos-y-condiciones.pdf" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-white transition-colors font-light">Términos y Condiciones</a></li>
              <li><a href="/legal/politica-de-privacidad.pdf" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-white transition-colors font-light">Política de Privacidad</a></li>
              <li><Link href="/garantias/" className="text-stone-400 hover:text-white transition-colors font-light">Garantía</Link></li>
            </ul>
          </div>

          {/* Contact Small */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Contacto</h3>
            <ul className="space-y-4 text-stone-400 font-light">
              <li>
                <a href="tel:+573227904563" className="hover:text-white transition-colors">Ventas: 322 790 4563</a>
              </li>
              <li>
                <a href="tel:+573009650060" className="hover:text-white transition-colors">Servicio: 300 965 0060</a>
              </li>
              <li>
                <a href="mailto:info@tenndalux.com" className="hover:text-white transition-colors">info@tenndalux.com</a>
              </li>
              <li className="text-stone-500 text-sm">
                Lun - Vie: 8:30 a.m. – 5:00 p.m.<br />
                Sáb: 8:30 a.m. – 12:00 m.
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-stone-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-500 text-sm font-light">
            &copy; {new Date().getFullYear()} Tenndalux. Todos los derechos reservados.
          </p>
          <p className="text-stone-600 text-sm font-light">
            Diseñado con pasión.
          </p>
        </div>
      </div>
    </footer>
  );
}
