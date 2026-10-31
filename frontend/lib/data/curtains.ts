/**
 * Información técnica fija de las nueve cortinas de /servicios.
 * Nombre, descripción e imagen proceden exclusivamente de la API de productos.
 */
export type Curtain = {
  id: string;
  title: string;
  shortLabel: string;
  image: string;
  description: string;
  idealPara: string[];
  beneficios: string[];
  opciones: string[];
};

export const CURTAIN_DETAILS: Pick<Curtain, 'id' | 'idealPara' | 'beneficios' | 'opciones'>[] = [
  {
    id: 'ondessence',
    idealPara: ['Salas amplias', 'Dormitorios principales', 'Hoteles', 'Ventanales piso a techo'],
    beneficios: ['Ondas técnicas uniformes', 'Movimiento fluido y silencioso', 'Tejidos europeos certificados (Light Fastness Clase 6)', 'Instalación premium con planchado a vapor'],
    opciones: ['Proporción 2.3 (onda sutil 9 cm)', 'Proporción 2.8 (onda profunda)', 'Automatización RF, Wi-Fi y app gratuita', 'Compatible con asistentes de voz'],
  },
  {
    id: 'luminux',
    idealPara: ['Espacios sociales', 'Ambientes modernos', 'Ventanales piso a techo', 'Salas de estar'],
    beneficios: ['Entrada de luz controlada', 'Estética continua y decorativa', 'Instalación profesional', 'Motorización opcional'],
    opciones: ['Luminux M (onda tipo montaña)', 'Luminux S (onda tipo S intercalada)', 'Accionamiento manual o motorizado', 'Recolección lateral, central o a extremos'],
  },
  {
    id: 'dunes',
    idealPara: ['Espacios de diseño protagonista', 'Salas elegantes', 'Ambientes sofisticados', 'Proyectos arquitectónicos'],
    beneficios: ['Estética sofisticada', 'Movimiento definido', 'Control suave de luz', 'Mayor control estructural en caída'],
    opciones: ['Sistema segmentado de ondas independientes', 'Automatización opcional', 'Instalación técnica especializada', 'Compatible con automatización'],
  },
  {
    id: 'celulares',
    idealPara: ['Habitaciones', 'Oficinas', 'Espacios con ruido exterior', 'Ambientes con alta exposición solar'],
    beneficios: ['Aislamiento térmico', 'Reducción de ruido exterior', 'Alta eficiencia energética', 'Sistema Día y Noche disponible'],
    opciones: ['Top Down Bottom Up', 'Manual o TwinPull (seguro para niños)', 'Motorizado RF + Bluetooth', 'Transparentes, translúcidas y blackout'],
  },
  {
    id: 'enrollables',
    idealPara: ['Oficinas', 'Salas de estar', 'Habitaciones', 'Cocinas'],
    beneficios: ['Control total de luz', 'Fácil mantenimiento', 'Durabilidad superior', 'Guías laterales disponibles para blackout'],
    opciones: ['Screen solar (filtro UV)', 'Blackout total', 'Translúcidas', 'Cabezal Modern 3 y perfiles Coverlight Boston'],
  },
  {
    id: 'paneles',
    idealPara: ['Grandes ventanales', 'Divisores de ambiente', 'Puertas corredizas', 'Espacios abiertos'],
    beneficios: ['Diseño arquitectónico', 'Sistema modular', 'Rieles de 2 a 10 vías', 'Gran impacto visual'],
    opciones: ['Telos de 50–60 cm', 'Motorización opcional', 'Recogida lateral, central o combinada', 'Instalación consecutiva hasta 11.5 m'],
  },
  {
    id: 'roller-duo',
    idealPara: ['Habitaciones', 'Oficinas en casa', 'Estudios', 'Salas multiuso'],
    beneficios: ['Doble funcionalidad', 'Control preciso de luz', 'Perfil inferior técnico', 'Cabezal de lujo'],
    opciones: ['Franjas opacas y transparentes', 'Automatización compatible', 'Telas texturizadas', 'Colores variados'],
  },
  {
    id: 'horizontales',
    idealPara: ['Estudios', 'Oficinas', 'Cocinas', 'Baños'],
    beneficios: ['Acabado artesanal en madera', 'Control eficiente de luz', 'Resistentes a agua y rayaduras', 'Retardantes al fuego'],
    opciones: ['Madera Basswood', 'Aluminio Micro y Mini', 'Poliéster con nanopartículas', 'Classic 50'],
  },
  {
    id: 'verticales',
    idealPara: ['Ventanas trapezoidales', 'Oficinas', 'Espacios comerciales', 'Ventanales amplios'],
    beneficios: ['Adaptación a ventanas inclinadas', 'Sistema de liberación para limpieza', 'Riel delgado con carros equidistantes', 'Motorización disponible'],
    opciones: ['Lamas de 9 cm', 'Lamas de 13 cm', 'Colección screen y blackout', 'Colección decorativa'],
  },
];
