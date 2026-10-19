import { Product, CountryCode } from '../types';

export const OFFICIAL_WHATSAPP_NUMBER = '+52 662 180 5354';
export const OFFICIAL_WHATSAPP_CLEAN = '526621805354';

export const OFFICIAL_BENEFICIARY = 'Javier Alan Rodriguez Yescas';

export const BANK_DETAILS = {
  mexico: [
    {
      bank: 'Banco Nu',
      type: 'CLABE / Tarjeta',
      accountNumber: '5101258665547429',
      beneficiary: OFFICIAL_BENEFICIARY,
      badge: 'Recomendado México (SPEI)',
    },
    {
      bank: 'Bancoppel',
      type: 'Tarjeta',
      accountNumber: '4169160624712155',
      beneficiary: OFFICIAL_BENEFICIARY,
      badge: 'Depósitos OXXO / Transferencia',
    },
  ],
  international: [
    {
      platform: 'Binance Pay',
      type: 'Binance ID',
      accountNumber: '453667986',
      beneficiary: OFFICIAL_BENEFICIARY,
      badge: 'Cripto Sin Comisiones (USDT)',
    },
    {
      platform: 'Binance / PayPal',
      type: 'Correo Electrónico',
      accountNumber: 'javieralanrodriguezyescas31@gmail.com',
      beneficiary: OFFICIAL_BENEFICIARY,
      badge: 'Internacional / Saldo Digital',
    },
  ],
};

export const PRODUCTS: Product[] = [
  {
    id: 'coursera-plus',
    name: 'Coursera Plus',
    category: 'Educación & Certificaciones',
    priceMxn: 150,
    priceUsd: 8.74,
    currencyType: 'USD',
    description: 'Acceso ilimitado a especializaciones, cursos y certificaciones profesionales universitarias.',
    highlights: [
      'Acceso ilimitado a +7,000 cursos',
      'Certificados oficiales con validez laboral',
      'Especializaciones de universidades top',
      'Aprende a tu propio ritmo',
    ],
    duration: 'Suscripción Activa',
    iconName: 'GraduationCap',
    popular: true,
  },
  {
    id: 'google-ai-pro',
    name: 'Google AI Pro / Gemini',
    category: 'Inteligencia Artificial',
    priceMxn: 150,
    priceUsd: 8.74,
    currencyType: 'USD',
    description: 'Inteligencia artificial avanzada con Gemini Pro para redacción, análisis, programación y flujos de trabajo.',
    highlights: [
      'Gemini Pro de máxima capacidad',
      'Análisis profundo y generación de código',
      'Redacción profesional e investigación',
      'Integración con herramientas Google',
    ],
    duration: 'Acceso Premium',
    iconName: 'Sparkles',
    popular: true,
  },
  {
    id: 'capcut-teams',
    name: 'CapCut Teams (25 Días)',
    category: 'Edición de Video',
    priceMxn: 150,
    priceUsd: 8.74,
    currencyType: 'USD',
    description: 'Editor de video profesional con herramientas avanzadas para creadores de contenido y proyectos audiovisuales.',
    highlights: [
      '25 Días de acceso completo Pro Teams',
      'Efectos, filtros y transiciones VIP',
      'Herramientas avanzadas de IA para video',
      'Exportación en máxima resolución sin marcas',
    ],
    duration: '25 Días Garantizados',
    iconName: 'Video',
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365 Family',
    category: 'Productividad & Nube',
    priceMxn: 150,
    priceUsd: 8.74,
    currencyType: 'USDT',
    description: 'Suscripción familiar para aplicaciones de Office, almacenamiento en la nube y herramientas de productividad avanzadas.',
    highlights: [
      'Word, Excel, PowerPoint y Outlook completos',
      'Almacenamiento seguro en la nube OneDrive',
      'Instalable en PC, Mac, tablets y celulares',
      'Actualizaciones y seguridad continua',
    ],
    duration: 'Suscripción Oficial',
    iconName: 'LayoutGrid',
  },
  {
    id: 'figma-pro',
    name: 'Figma Pro (.edu)',
    category: 'Diseño UI/UX & Prototipado',
    priceMxn: 300,
    priceUsd: 17.00,
    currencyType: 'USDT',
    description: 'Licencia educativa Pro por 2 años para diseño de interfaces, prototipado y trabajo colaborativo avanzado.',
    highlights: [
      '2 Años completos de licencia Pro',
      'Historial de versiones ilimitado',
      'Colaboración en tiempo real sin límites',
      'Acceso a FigJam y librerías completas',
    ],
    duration: '2 Años de Licencia (.edu)',
    iconName: 'PenTool',
    popular: true,
  },
];

export const COUNTRIES: { code: CountryCode; name: string; flag: string; currency: string }[] = [
  { code: 'mexico', name: 'México', flag: '🇲🇽', currency: 'MXN' },
  { code: 'venezuela', name: 'Venezuela', flag: '🇻🇪', currency: 'USDT / Binance' },
  { code: 'colombia', name: 'Colombia', flag: '🇨🇴', currency: 'USDT / USD' },
  { code: 'otro', name: 'Otro País', flag: '🌎', currency: 'USDT / USD' },
];

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${OFFICIAL_WHATSAPP_CLEAN}?text=${encodeURIComponent(message)}`;
}

export function formatWhatsAppOrderMessage(
  products: { name: string; qty: number; priceMxn: number; priceUsd: number; currencyType: string }[],
  totalMxn: number,
  totalUsd: number,
  paymentMethod: string,
  concept: string,
  userCountry: string,
  userProfile: string
): string {
  const productLines = products
    .map((p) => `• ${p.qty}x ${p.name} ($${p.priceMxn * p.qty} MXN / $${(p.priceUsd * p.qty).toFixed(2)} ${p.currencyType})`)
    .join('\n');

  return `¡Hola! Me comunico desde la plataforma oficial de Servicios Digitales Premium.

⚠️ *Confirmación previa a compra por WhatsApp*
📍 País: ${userCountry}
👤 Perfil: ${userProfile}

📦 *Servicios solicitados:*
${productLines}

💰 *Total estimado:* $${totalMxn.toLocaleString()} MXN / $${totalUsd.toFixed(2)} USD/USDT
💳 *Método de pago de preferencia:* ${paymentMethod}
📝 *Concepto a colocar:* "${concept}"

Por favor, confirmen disponibilidad inmediata y datos para proceder. ¡Muchas gracias!`;
}
