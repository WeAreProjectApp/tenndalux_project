'use client';

import { useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import messages from './messages.json';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  Sun, 
  Home,
  Wind,
  Maximize2,
  X,
  Info,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { whatsappUrl } from '@/lib/whatsapp';
import { useProducts } from '@/lib/hooks/useProducts';
import { toProductCard, type ProductCard } from '@/lib/services/products';
import CatalogueStatus from '@/components/products/CatalogueStatus';

// WhatsApp SVG component
const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg style={{ width: `${size}px`, height: `${size}px` }} viewBox="0 0 448 512" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6"/>
  </svg>
);

// Categorías principales
const categories = [
  { id: 'todos', label: 'Todos', icon: Home },
  { id: 'cortinas-diseno', label: 'Cortinas de Diseño', icon: Home },
  { id: 'soluciones-practicas', label: 'Soluciones Prácticas', icon: Maximize2 },
  { id: 'persianas', label: 'Persianas', icon: Wind },
  { id: 'exteriores', label: 'Exteriores', icon: Sun },
  { id: 'recubrimientos', label: 'Recubrimientos', icon: Home },
];


function ProductCatalogue() {
  const t = useTranslations('productDetails');
  const { products: catalogue, loading, error, retry } = useProducts();
  const products = catalogue.map(toProductCard);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null);

  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleWhatsApp = (interest?: string) => {
    window.open(whatsappUrl(interest), '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      {/* Hero */}
      <section className="pt-28 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 sm:mb-8 tracking-tight text-stone-900 leading-tight">
              Nuestros Productos
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-stone-600 leading-relaxed">
              Encuentra la solución perfecta para tu espacio. Desde cortinas de diseño 
              hasta sistemas de automatización inteligente.
            </p>
          </motion.div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-20">
            {categories.map((category) => (
              <button
                key={category.id}
                aria-pressed={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all hover:scale-105 flex items-center gap-1.5 sm:gap-2 border text-sm sm:text-base ${
                  selectedCategory === category.id 
                    ? 'bg-stone-900 text-stone-50 border-stone-900 font-semibold' 
                    : 'bg-white text-stone-600 border-stone-200 font-medium'
                }`}
              >
                <category.icon style={{ width: '16px', height: '16px' }} />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <CatalogueStatus loading={loading} error={error} empty={!filteredProducts.length} onRetry={retry} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                data-testid={`product-card-${product.id}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {product.featured && (
                    <div className="absolute top-5 right-5">
                      <span className="px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-stone-900 text-stone-50 font-semibold">
                        ⭐ Insignia
                      </span>
                    </div>
                  )}
                  <div className="absolute top-5 left-5">
                    <span className="px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-white/90 text-stone-900 font-semibold">
                      {product.tagline}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-semibold mb-4 text-stone-900">
                    {product.name}
                  </h3>
                  
                  <p className="text-base mb-6 text-stone-600 leading-relaxed">
                    {product.shortDescription}
                  </p>

                  {/* Ideal Para */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold mb-4 text-stone-900 tracking-wider">
                      IDEAL PARA:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.idealPara.slice(0, 3).map((item, i) => (
                        <span 
                          key={i}
                          className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-600"
                        >
                          {item}
                        </span>
                      ))}
                      {product.idealPara.length > 3 && (
                        <span className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-500">
                          +{product.idealPara.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full py-5 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] border border-stone-300 text-stone-900"
                    >
                      <Info style={{ width: '20px', height: '20px' }} />
                      <span className="font-medium text-base">Ver Detalles</span>
                    </button>
                    
                    <button
                      onClick={() => handleWhatsApp(`cotizar ${product.name}`)}
                      className="w-full py-5 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] bg-stone-900 text-stone-50"
                    >
                      <WhatsAppIcon size={20} />
                      <span className="font-medium text-base">Cotizar</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-24 md:py-40 px-4 sm:px-8 bg-stone-900">
        <div className="max-w-4xl mx-auto text-center py-6 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-8 sm:mb-10 tracking-tight text-stone-50">
              ¿No sabes cuál elegir?
            </h2>
            <p className="text-xl md:text-2xl mb-14 text-stone-300 leading-relaxed">
              Nuestros asesores te ayudan a encontrar la solución perfecta para tu proyecto
            </p>
            <button
              onClick={() => handleWhatsApp('hablar con un asesor')}
              className="px-8 sm:px-14 py-5 sm:py-6 rounded-full inline-flex items-center gap-3 sm:gap-4 transition-all hover:scale-105 bg-stone-50 text-stone-900"
            >
              <span className="text-base sm:text-xl font-semibold">Hablar con un Asesor</span>
              <ArrowRight style={{ width: '24px', height: '24px' }} />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-detail-title"
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-stone-100 p-4 sm:p-8 flex items-center justify-between z-10">
                <div>
                  <h2 id="product-detail-title" className="text-xl sm:text-3xl font-semibold mb-1 sm:mb-2 text-stone-900">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-base text-stone-500">
                    {selectedProduct.tagline}
                  </p>
                </div>
                <button
                  aria-label={t('close')}
                  onClick={() => setSelectedProduct(null)}
                  className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
                >
                  <X style={{ width: '24px', height: '24px', color: '#78716C' }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-10 space-y-8 sm:space-y-10">
                {/* Image */}
                <div className="aspect-video rounded-2xl overflow-hidden relative">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 896px) 100vw, 896px"
                    className="object-cover"
                  />
                </div>

                {/* Description */}
                <div>
                  <p className="text-lg text-stone-700 leading-relaxed">
                    {selectedProduct.shortDescription}
                  </p>
                </div>

                {/* Ideal Para */}
                <div>
                  <h3 className="text-xl font-semibold mb-5 text-stone-900">
                    Ideal Para
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedProduct.idealPara.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-stone-900" />
                        <span className="text-base text-stone-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beneficios */}
                <div>
                  <h3 className="text-xl font-semibold mb-5 text-stone-900">
                    Beneficios Clave
                  </h3>
                  <div className="space-y-4">
                    {selectedProduct.beneficios.map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Check style={{ width: '24px', height: '24px', color: '#292524', flexShrink: 0, marginTop: '2px' }} />
                        <span className="text-base text-stone-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Especificaciones */}
                <div>
                  <h3 className="text-xl font-semibold mb-5 text-stone-900">
                    Especificaciones Técnicas
                  </h3>
                  <div className="bg-stone-100 rounded-2xl p-5 sm:p-8 space-y-4">
                    {selectedProduct.especificaciones.map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-stone-500" />
                        <span className="text-base text-stone-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opciones */}
                <div>
                  <h3 className="text-xl font-semibold mb-5 text-stone-900">
                    Opciones Disponibles
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.opciones.map((item, i) => (
                      <span 
                        key={i}
                        className="px-5 py-3 rounded-full text-sm bg-stone-100 text-stone-900 font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6">
                  <button
                    onClick={() => handleWhatsApp(`cotizar ${selectedProduct.name}`)}
                    className="w-full px-12 py-5 rounded-full flex items-center justify-center gap-4 transition-all hover:scale-105 bg-stone-900 text-stone-50"
                  >
                    <WhatsAppIcon size={24} />
                    <span className="text-lg font-semibold">Cotizar {selectedProduct.name}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Productos() {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><ProductCatalogue /></NextIntlClientProvider>;
}
