'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { whatsappUrl } from '@/lib/whatsapp';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: "¿Cuánto tiempo tarda la fabricación e instalación?",
    answer: "La fabricación toma entre 5 y 10 días hábiles. Una vez listo tu pedido, la instalación normalmente se realiza en 1 o 2 días, según el tamaño del proyecto y la cantidad de productos."
  },
  {
    question: "¿Qué garantía ofrecen?",
    answer: "Ofrecemos hasta 5 años de garantía, según el producto. Nuestros motores cuentan con 5 años de garantía, y además brindamos respaldo tanto en la instalación como en el servicio posventa para que tengas total tranquilidad."
  },
  {
    question: "¿Puedo automatizar cortinas que ya tengo instaladas?",
    answer: "En muchos casos, sí. Todo depende del sistema, el estado de las cortinas y su compatibilidad. Realizamos una visita de evaluación para confirmar si es posible automatizarlas o recomendar la mejor alternativa."
  },
  {
    question: "¿Realizan visitas fuera de Bogotá?",
    answer: "Sí. Atendemos Bogotá y la Sabana, incluyendo Chía, Cajicá, Cota y municipios cercanos. Para otras ciudades, ofrecemos asesoría virtual y contamos con una red de aliados para la instalación en diferentes zonas del país."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const faqsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Apple-style blur reveal
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 60, filter: 'blur(15px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.2, ease: 'power4.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 85%' }
        }
      );

      gsap.fromTo(faqsRef.current?.children || [],
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.8, stagger: 0.1, ease: 'power4.out',
          scrollTrigger: { trigger: faqsRef.current, start: 'top 80%' }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-36 bg-white border-t border-stone-200">
      <div className="max-w-[900px] mx-auto px-6 sm:px-8">
        <div ref={headerRef} className="text-center mb-10 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-6 text-xl md:text-2xl text-stone-500 font-light">
            Resolvemos tus dudas para que tomes la mejor decisión.
          </p>
        </div>

        <div ref={faqsRef} className="space-y-6">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border-2 border-stone-200 rounded-3xl overflow-hidden transition-all duration-300 hover:border-stone-300 bg-stone-50/30"
            >
              <button
                id={`faq-question-${index}`}
                type="button"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-8 text-left focus:outline-none"
              >
                <span className="font-semibold text-stone-900 text-xl pr-8">
                  {faq.question}
                </span>
                <ChevronDownIcon 
                  className={`w-7 h-7 text-stone-400 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                aria-hidden={openIndex !== index}
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-8 pb-8 text-lg text-stone-600 font-light leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-stone-500 mb-6">¿Tienes más preguntas?</p>
          <a 
            href={whatsappUrl('hablar con un experto sobre mi proyecto')} 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 border-2 border-stone-200 rounded-full text-lg text-stone-900 font-semibold hover:bg-stone-50 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 448 512" fill="currentColor">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6"/>
            </svg>
            Chatear con un experto
          </a>
        </div>
      </div>
    </section>
  );
}
