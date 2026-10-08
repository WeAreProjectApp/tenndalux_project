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

// Productos completos
const products = [
  // CORTINAS DE DISEÑO
  {
    id: 'ondessence',
    name: 'Cortina Ondessence',
    tagline: 'Producto Insignia',
    category: 'cortinas-diseno',
    shortDescription: 'La evolución moderna de la cortina tradicional con sistema Ripplefold',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMGRlc2lnbiUyMDIwMjZ8ZW58MXx8fHwxNzM5OTI0MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Salas amplias', 'Dormitorios principales', 'Hoteles', 'Espacios institucionales', 'Ventanales piso a techo'],
    beneficios: [
      'Ondas técnicas uniformes y continuas',
      'Movimiento fluido y silencioso',
      'Tejidos europeos certificados Light Fastness Clase 6',
      'Instalación premium con planchado a vapor',
      'Automatización compatible con voz',
    ],
    especificaciones: [
      'Ancho máximo: 11.80 m',
      'Altura máxima: 5.10 m',
      'Proporciones: 2.3 (sutil) o 2.8 (profunda)',
      'Compatible con riel curvo y ángulos 90°',
      'Automatización RF, Wi-Fi y app gratuita',
    ],
    opciones: ['Velo', 'Translúcidas', 'Semi-blackout', 'Blackout', 'Retardantes al fuego'],
    featured: true,
  },
  {
    id: 'luminux',
    name: 'Luminux',
    tagline: 'Velo Contemporáneo',
    category: 'cortinas-diseno',
    shortDescription: 'Cortina de velo con diseño escultural que combina luz difusa y privacidad',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZW50aG91c2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Mzk5MjQwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Espacios sociales', 'Salas modernas', 'Comedores', 'Áreas de diseño protagonista'],
    beneficios: [
      'Entrada de luz controlada con privacidad',
      'Estética continua y decorativa',
      'Movimiento visual ligero',
      'Motorización opcional',
      'Instalación profesional',
    ],
    especificaciones: [
      'Luminux M: onda tipo montaña continua',
      'Luminux S: onda tipo S intercalada',
      'Riel delgado de aluminio alta precisión',
      'Sistema de giro interno tipo vertical',
      'Recolección lateral, central o a extremos',
      'Compatible con ventanales piso a techo',
    ],
    opciones: ['Versión M (Montaña)', 'Versión S (Intercalada)', 'Motorización', 'Accionamiento manual'],
    featured: false,
  },
  {
    id: 'dunes',
    name: 'Dunes',
    tagline: 'Onda Montaña Segmentada',
    category: 'cortinas-diseno',
    shortDescription: 'Cortina de velo con ondas independientes para acabado visual refinado',
    image: 'https://images.unsplash.com/photo-1758974775331-c5400bbef625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGl2aW5nJTIwcm9vbSUyMGN1cnRhaW5zfGVufDF8fHx8MTc3MTI5NzczMHww&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Espacios donde se requiere diseño protagonista', 'Proyectos de alto valor estético', 'Salas formales', 'Hoteles boutique'],
    beneficios: [
      'Estética sofisticada y única',
      'Movimiento definido y estructurado',
      'Control suave de luz natural',
      'Automatización opcional',
      'Instalación técnica especializada',
    ],
    especificaciones: [
      'Sistema segmentado de ondas independientes',
      'Cada ola es un tramo independiente de tela',
      'Mayor control estructural en caída',
      'Compatible con automatización',
    ],
    opciones: ['Motorización', 'Diferentes densidades de tela', 'Varias alturas'],
    featured: false,
  },

  // SOLUCIONES PRÁCTICAS
  {
    id: 'celulares',
    name: 'Persianas Celulares',
    tagline: 'Eficiencia Térmica',
    category: 'soluciones-practicas',
    shortDescription: 'Sistema con cámara de aire para aislamiento térmico y acústico superior',
    image: 'https://images.unsplash.com/photo-1750271336580-f11df678e840?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwcm9sbGVyJTIwYmxpbmRzfGVufDF8fHx8MTc3MTI5NzczMHww&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Climas extremos', 'Oficinas con ruido exterior', 'Habitaciones que requieren aislamiento', 'Proyectos sustentables'],
    beneficios: [
      'Reducción de costos de climatización hasta 30%',
      'Aislamiento acústico efectivo',
      'Instalación dentro del marco',
      'Sistema seguro para niños (TwinPull)',
      'Alta eficiencia energética',
    ],
    especificaciones: [
      'Requiere 6.5 cm de profundidad en marco',
      'Cámara de aire interna para aislamiento',
      'Sistema Top Down Bottom Up disponible',
      'Versión Día y Noche (dos telas)',
      'Recubrimiento de aluminio en blackout',
      'Motorización RF + Bluetooth',
    ],
    opciones: ['Transparentes', 'Translúcidas', 'Blackout', 'Retardante al fuego', 'Sistema Día/Noche', 'Manual', 'TwinPull', 'Motorizado'],
    featured: false,
  },
  {
    id: 'enrollables',
    name: 'Cortinas Enrollables',
    tagline: 'Minimalismo Funcional',
    category: 'soluciones-practicas',
    shortDescription: 'Solución limpia y moderna para control de luz con múltiples opciones de tela',
    image: 'https://images.unsplash.com/photo-1755325541565-aca7a68f6e66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2luZG93JTIwdHJlYXRtZW50cyUyMGludGVyaW9yfGVufDF8fHx8MTc3MTI5NzczMXww&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Oficinas', 'Cocinas', 'Baños', 'Espacios minimalistas', 'Ventanas pequeñas y medianas'],
    beneficios: [
      'Diseño limpio y discreto',
      'Fácil mantenimiento',
      'Perfiles Coverlight eliminan filtraciones',
      'Guías laterales para blackout total',
      'Cabezal Modern 3 premium',
    ],
    especificaciones: [
      'Cabezal Modern 3',
      'Perfiles Coverlight Boston',
      'Guías laterales en blanco y negro',
      'Compatible con motorización',
      'Tejidos screen, translúcidos y blackout',
    ],
    opciones: ['Screen', 'Translúcidas', 'Blackout', 'Fibra de vidrio', 'Poliéster', 'Algodón', 'PET reciclado', 'Retardante al fuego'],
    featured: false,
  },
  {
    id: 'roller-duo',
    name: 'Roller Dúo',
    tagline: 'Doble Funcionalidad',
    category: 'soluciones-practicas',
    shortDescription: 'Sistema de doble capa con franjas alternadas para control de luz sin movimiento',
    image: 'https://images.unsplash.com/photo-1770129481027-baafe0748e1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBibGluZHMlMjBuYXR1cmFsJTIwbGlnaHR8ZW58MXx8fHwxNzcxMjk3NzMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Habitaciones', 'Oficinas en casa', 'Estudios', 'Espacios multiuso'],
    beneficios: [
      'Regula luz sin subir la cortina',
      'Perfil inferior técnico de lujo',
      'Doble funcionalidad en un solo producto',
      'Automatización compatible',
      'Franjas opacas y transparentes alternadas',
    ],
    especificaciones: [
      'Sistema de doble capa',
      'Franjas opacas y transparentes alternadas',
      'Cabezal de lujo',
      'Perfil inferior premium',
      'Compatible con motorización',
    ],
    opciones: ['Motorización', 'Diferentes anchos de franja', 'Manual'],
    featured: false,
  },
  {
    id: 'paneles',
    name: 'Paneles Deslizantes',
    tagline: 'Diseño Modular',
    category: 'soluciones-practicas',
    shortDescription: 'Sistema modular ideal para grandes ventanales y divisores de ambiente',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Mzk5MjQwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Ventanas amplias', 'Divisores de espacio', 'Puertas corredizas', 'Espacios abiertos'],
    beneficios: [
      'Modularidad hasta 11.5 metros',
      'Diseño arquitectónico contemporáneo',
      'Fácil operación',
      'Gran impacto visual',
      'Riel exclusivo',
    ],
    especificaciones: [
      'Paños de 50-60 cm',
      'Rieles de 2 a 10 vías',
      'Instalación consecutiva hasta 11.5 metros',
      'Recogida lateral, central o combinada',
      'Motorización opcional',
    ],
    opciones: ['Manual', 'Motorizado', '2 a 10 vías', 'Diferentes telas'],
    featured: false,
  },

  // PERSIANAS
  {
    id: 'horizontales',
    name: 'Persianas Horizontales',
    tagline: 'Clásico Renovado',
    category: 'persianas',
    shortDescription: 'Persianas en madera Basswood, aluminio y poliéster con acabados premium',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzaG93cm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTczOTkyNDAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Oficinas', 'Estudios', 'Bibliotecas', 'Espacios clásicos', 'Hogares tradicionales'],
    beneficios: [
      'Acabado artesanal en madera',
      'Poliéster con nanopartículas resistente al agua',
      'Aluminio moderno e industrial',
      'Control preciso de luz',
    ],
    especificaciones: [
      'Madera Basswood acabado artesanal',
      'Aluminio Micro, Mini y Classic 50',
      'Poliéster resistente a rayaduras',
      'Opciones retardantes al fuego',
      'Laminillas perforadas o sólidas',
    ],
    opciones: ['Madera Basswood', 'Aluminio Micro', 'Aluminio Mini', 'Classic 50', 'Poliéster', 'Manual', 'Motorizado'],
    featured: false,
  },
  {
    id: 'verticales',
    name: 'Persianas Verticales',
    tagline: 'Versatilidad Moderna',
    category: 'persianas',
    shortDescription: 'Sistema adaptable incluso a ventanas inclinadas con lamas de 9 y 13 cm',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzdW5saWdodCUyMHdpbmRvd3N8ZW58MXx8fHwxNzM5OTI0MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Ventanas amplias', 'Puertas de vidrio', 'Ventanas trapezoidales', 'Espacios corporativos'],
    beneficios: [
      'Adaptación a ventanas inclinadas',
      'Sistema de liberación para limpieza',
      'Riel delgado discreto',
      'Motorización disponible',
      'Adaptable a formas irregulares',
    ],
    especificaciones: [
      'Lamas de 9 cm y 13 cm',
      'Adaptable a ventanas trapezoidales',
      'Sistema de liberación para limpieza',
      'Riel delgado con carros equidistantes',
      'Colección screen, blackout y decorativa',
    ],
    opciones: ['Lamas 9 cm', 'Lamas 13 cm', 'Screen', 'Blackout', 'Decorativa', 'Motorización'],
    featured: false,
  },

  // RECUBRIMIENTOS
  {
    id: 'recubrimientos',
    name: 'Recubrimientos para Paredes',
    tagline: 'Paredes que Hablan',
    category: 'recubrimientos',
    shortDescription: 'Vinilo, textil y ecológico. Transforma tus espacios con texturas premium',
    image: 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWJyaWMlMjB0ZXh0dXJlJTIwY3VydGFpbnN8ZW58MXx8fHwxNzM5OTI0MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Salas', 'Habitaciones', 'Oficinas', 'Espacios comerciales', 'Hoteles'],
    beneficios: [
      'Texturas premium y exclusivas',
      'Instalación profesional certificada',
      'Diseños personalizados',
      'Materiales libres de compuestos nocivos',
      'Resistencia a la humedad',
    ],
    especificaciones: [
      'Opciones en vinilo, textil y ecológico',
      'Resistentes a humedad',
      'Instalación profesional',
      'Materiales libres de compuestos nocivos',
      'Alta durabilidad',
    ],
    opciones: ['Vinilo', 'Textil', 'Ecológico', 'Resistente a humedad', 'Diseños personalizados'],
    featured: false,
  },

  // EXTERIORES
  {
    id: 'toldos-verticales',
    name: 'Toldos Verticales',
    tagline: 'Protección Solar',
    category: 'exteriores',
    shortDescription: 'Mecanismos premium en acero para protección total de terrazas y balcones',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwdGVycmFjZSUyMG91dGRvb3J8ZW58MXx8fHwxNzM5OTI0MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Terrazas', 'Balcones', 'Patios', 'Áreas comerciales', 'Restaurantes'],
    beneficios: [
      'Mecanismos en acero colado',
      'Soportes en acero inoxidable',
      'Protección UV superior',
      'Instalación profesional',
      'Motorización disponible',
    ],
    especificaciones: [
      'Mecanismos en acero colado',
      'Guías con varilla o guaya de acero',
      'Soportes en acero inoxidable',
      'Brazos extensibles y verticales',
      'Telas resistentes a rayos UV',
    ],
    opciones: ['Motorización', 'Sensores', 'Manual', 'Diferentes tamaños'],
    featured: false,
  },
  {
    id: 'toldos-extensibles',
    name: 'Toldos de Brazos Extensibles',
    tagline: 'Ingeniería Premium',
    category: 'exteriores',
    shortDescription: 'Sistemas Cofrex, Crab y PTP para máxima proyección y durabilidad',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5JTIwaG91c2UlMjBleHRlcmlvcnxlbnwxfHx8fDE3Mzk5MjQwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Terrazas amplias', 'Áreas de piscina', 'Jardines', 'Espacios comerciales grandes'],
    beneficios: [
      'Sistemas de alta ingeniería',
      'Cofre protector disponible',
      'Hasta 12 metros de ancho',
      'Estructuras reforzadas',
      'Automatización y sensores',
    ],
    especificaciones: [
      'Sistema Cofrex: cofre protector, hasta 6m x 3m',
      'Sistema Crab: barra cuadrada, hasta 12m x 4m',
      'Sistema PTP: liviano, hasta 6m x 3.5m',
      'Telas resistentes a rayos UV',
      'Motorización y sensores disponibles',
    ],
    opciones: ['Sistema Cofrex', 'Sistema Crab', 'Sistema PTP', 'Motorización', 'Sensores de viento/sol'],
    featured: false,
  },
  {
    id: 'pergolas',
    name: 'Pérgolas',
    tagline: 'Arquitectura Exterior',
    category: 'exteriores',
    shortDescription: 'Pérgolas retráctiles y bioclimáticas con ingeniería estructural premium',
    image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBwZXJnb2xhJTIwb3V0ZG9vciUyMGRlc2lnbnxlbnwxfHx8fDE3NzEyOTc3MzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Jardines', 'Terrazas', 'Áreas de recreación', 'Espacios sociales exteriores'],
    beneficios: [
      'Ingeniería estructural certificada',
      'Diseño arquitectónico personalizado',
      'Materiales premium',
      'Automatización disponible',
      'Retráctiles y bioclimáticas',
    ],
    especificaciones: [
      'Diseño retráctil y bioclimático',
      'Ingeniería estructural',
      'Materiales premium resistentes',
      'Automatización disponible',
      'Diseños personalizados',
    ],
    opciones: ['Retráctil', 'Bioclimática', 'Motorización', 'Diseño personalizado'],
    featured: false,
  },
  {
    id: 'cortinas-exteriores',
    name: 'Cortinas Exteriores',
    tagline: 'Control Solar Exterior',
    category: 'exteriores',
    shortDescription: 'Protección solar y privacidad para espacios exteriores',
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwY3VydGFpbnMlMjBwYXRpb3xlbnwxfHx8fDE3NzEyOTc3MzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Pérgolas', 'Terrazas', 'Gazebos', 'Espacios semi-abiertos'],
    beneficios: [
      'Protección solar efectiva',
      'Privacidad exterior',
      'Telas resistentes a intemperie',
      'Motorización disponible',
      'Fácil operación',
    ],
    especificaciones: [
      'Telas resistentes a rayos UV',
      'Resistentes a humedad',
      'Motorización opcional',
      'Diferentes sistemas de instalación',
    ],
    opciones: ['Manual', 'Motorización', 'Diferentes telas', 'Screen exterior'],
    featured: false,
  },
  {
    id: 'peliculas-solares',
    name: 'Películas Solares',
    tagline: 'Protección Invisible',
    category: 'exteriores',
    shortDescription: 'Bloqueo UV 99% y protección de vidrio sin sacrificar visibilidad',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzdW5saWdodCUyMHdpbmRvd3N8ZW58MXx8fHwxNzM5OTI0MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    idealPara: ['Oficinas', 'Edificios corporativos', 'Hogares con alta exposición solar', 'Vehículos'],
    beneficios: [
      'Reducción de calor hasta 80%',
      'Protección UV 99%',
      'Ahorro energético comprobado',
      'Instalación sin obra',
      'Protección del vidrio',
    ],
    especificaciones: [
      'Bloqueo UV 99%',
      'Reducción de calor hasta 80%',
      'Instalación sin obra',
      'No sacrifica visibilidad',
      'Diferentes niveles de opacidad',
    ],
    opciones: ['Transparente', 'Semi-opaca', 'Espejada', 'Diferentes niveles UV'],
    featured: false,
  },
];

function ProductCatalogue() {
  const t = useTranslations('productDetails');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

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
