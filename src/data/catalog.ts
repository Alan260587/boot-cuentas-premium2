import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Product, CountryCode } from '../types';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';

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

export const DEFAULT_PRODUCTS: Product[] = [
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
    available: true,
    promoBadge: 'Más Solicitado',
    stockNote: 'Entrega Rápida',
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
    available: true,
    promoBadge: 'Más Solicitado',
    stockNote: 'Entrega Rápida',
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
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
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
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
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
    available: true,
    promoBadge: 'Licencia 2 Años',
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'canva-pro',
    name: 'Canva Pro Equipos',
    category: 'Diseño UI/UX & Prototipado',
    priceMxn: 150,
    priceUsd: 8.74,
    currencyType: 'USD',
    description: 'Suite de diseño gráfico profesional con plantillas ilimitadas, estudio mágico con IA y eliminador de fondos.',
    highlights: [
      'Más de 100 millones de fotos, videos y elementos Pro',
      'Eliminador de fondos en 1 clic con IA',
      'Estudio Mágico, redimensionado y Kit de Marca',
      'Exportación en alta calidad y fondos transparentes',
    ],
    duration: 'Suscripción Activa',
    iconName: 'Palette',
    popular: true,
    available: true,
    promoBadge: 'Nuevo Destacado',
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus / OpenAI Pro',
    category: 'Inteligencia Artificial',
    priceMxn: 250,
    priceUsd: 14.50,
    currencyType: 'USDT',
    description: 'Potencia tu trabajo con acceso completo a los modelos avanzados de OpenAI, generación de imágenes y análisis.',
    highlights: [
      'Acceso prioritario a modelos GPT-4o y razonamiento',
      'Generación de imágenes con DALL·E integrado',
      'Análisis de documentos PDF, Excel y código',
      'Respuestas rápidas incluso en horas de alta demanda',
    ],
    duration: 'Mensual Garantizado',
    iconName: 'Bot',
    popular: true,
    available: true,
    promoBadge: 'Alta Demanda',
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity AI Pro',
    category: 'Inteligencia Artificial',
    priceMxn: 180,
    priceUsd: 10.50,
    currencyType: 'USD',
    description: 'Motor de investigación e inteligencia artificial en tiempo real con fuentes verificadas y múltiples modelos Pro.',
    highlights: [
      'Búsquedas Pro ilimitadas con fuentes en vivo',
      'Selección de modelos avanzados (Claude, GPT, Sonar)',
      'Subida y análisis ilimitado de archivos y estudios',
      'Ideal para investigadores, estudiantes y profesionales',
    ],
    duration: 'Suscripción Activa',
    iconName: 'Cpu',
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud Pro',
    category: 'Diseño UI/UX & Prototipado',
    priceMxn: 350,
    priceUsd: 20.00,
    currencyType: 'USDT',
    description: 'Colección de aplicaciones creativas líderes para diseño, fotografía, video y web con IA generativa Adobe Firefly.',
    highlights: [
      'Photoshop, Illustrator, Premiere Pro y After Effects',
      'Acrobat Pro, Lightroom e InDesign incluidos',
      'Relleno generativo con inteligencia artificial Firefly',
      'Almacenamiento en la nube y fuentes Adobe Fonts',
    ],
    duration: 'Acceso Completo',
    iconName: 'PenTool',
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'youtube-music-premium',
    name: 'YouTube Premium + Music',
    category: 'Streaming & Entretenimiento',
    priceMxn: 130,
    priceUsd: 7.50,
    currencyType: 'USD',
    description: 'Disfruta de todos tus videos y música favorita sin interrupciones publicitarias, con descargas y pantalla apagada.',
    highlights: [
      'Videos 100% libres de anuncios en todos tus equipos',
      'Reproducción en segundo plano y con pantalla bloqueada',
      'YouTube Music Premium incluido sin costo extra',
      'Descarga videos y playlists para ver sin internet',
    ],
    duration: 'Suscripción Mensual',
    iconName: 'Music',
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'duolingo-super',
    name: 'Duolingo Super Familiar',
    category: 'Educación & Certificaciones',
    priceMxn: 140,
    priceUsd: 8.20,
    currencyType: 'USD',
    description: 'Aprende inglés, francés, alemán o más de 40 idiomas más rápido, sin anuncios y con vidas ilimitadas.',
    highlights: [
      'Vidas ilimitadas para practicar sin interrupciones',
      'Cero anuncios al terminar cada lección',
      'Práctica personalizada de errores y desafíos legendarios',
      'Se activa directamente en tu perfil personal',
    ],
    duration: 'Suscripción Activa',
    iconName: 'Globe',
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
  },
  {
    id: 'combo-streaming-4k',
    name: 'Combo Streaming Pro 4K',
    category: 'Streaming & Entretenimiento',
    priceMxn: 140,
    priceUsd: 8.20,
    currencyType: 'USD',
    description: 'Acceso garantizado a entretenimiento en ultra alta definición 4K HDR para disfrutar series, películas y estrenos.',
    highlights: [
      'Calidad Ultra HD 4K y soporte multidispositivo',
      'Perfil privado con PIN personalizable',
      'Soporte y garantía durante todo tu periodo activo',
      'Activación inmediata por WhatsApp oficial',
    ],
    duration: '30 Días con Garantía',
    iconName: 'Tv',
    popular: false,
    available: true,
    stockNote: 'Entrega Rápida',
  },
];

// Keep PRODUCTS export for compatibility; live components use getSavedProducts()
export const PRODUCTS: Product[] = DEFAULT_PRODUCTS;

const CATALOG_STORAGE_KEY = 'sdp_catalog_products_v2';
const EXCHANGE_RATE_STORAGE_KEY = 'sdp_exchange_rate_mxn_usd';
const CATALOG_UPDATED_AT_KEY = 'sdp_catalog_updated_at_v2';
const DEVICE_ID_STORAGE_KEY = 'sdp_device_sync_id_v1';
export const DEFAULT_EXCHANGE_RATE = 17.16;

let catalogRealtimeUnsubscribe: (() => void) | null = null;

function getDeviceSyncId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!existing) {
      existing = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, existing);
    }
    return existing;
  } catch {
    return `dev_${Date.now()}`;
  }
}

export function getCatalogLastUpdatedAt(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(CATALOG_UPDATED_AT_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function normalizeProductsList(products: Product[]): Product[] {
  return products.map((p) => ({
    id: String(p.id || `prod-${Date.now()}`),
    name: String(p.name || 'Servicio Digital'),
    category: String(p.category || 'Servicios Digitales'),
    priceMxn: Number(p.priceMxn) || 0,
    priceUsd: Number(Number(p.priceUsd || 0).toFixed(2)),
    currencyType: p.currencyType === 'USDT' ? 'USDT' : 'USD',
    description: String(p.description || ''),
    highlights: Array.isArray(p.highlights) ? p.highlights.map((h) => String(h)) : [],
    duration: String(p.duration || 'Suscripción Activa'),
    iconName: String(p.iconName || 'Sparkles'),
    popular: Boolean(p.popular),
    available: p.available !== false,
    promoBadge: p.promoBadge ? String(p.promoBadge) : '',
    stockNote: String(p.stockNote || 'Entrega Rápida'),
  }));
}

async function persistCatalogToCloud(
  products: Product[],
  exchangeRate: number,
  updatedAt: number
): Promise<void> {
  if (typeof window === 'undefined') return;
  const path = 'appConfig/catalog';
  try {
    await setDoc(doc(db, 'appConfig', 'catalog'), {
      products: normalizeProductsList(products).slice(0, 200),
      exchangeRate: Math.min(1000, Math.max(1, Number(exchangeRate.toFixed(2)))),
      updatedAt,
      updatedBy: getDeviceSyncId(),
      authCode: '1987',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function getSavedExchangeRate(): number {
  if (typeof window === 'undefined') return DEFAULT_EXCHANGE_RATE;
  try {
    const raw = localStorage.getItem(EXCHANGE_RATE_STORAGE_KEY);
    if (!raw) return DEFAULT_EXCHANGE_RATE;
    const val = parseFloat(raw);
    return !isNaN(val) && val > 0 ? val : DEFAULT_EXCHANGE_RATE;
  } catch {
    return DEFAULT_EXCHANGE_RATE;
  }
}

export function saveExchangeRate(rate: number): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanRate = Math.min(1000, Math.max(1, Number(rate.toFixed(2))));
    const updatedAt = Date.now();
    const currentProducts = getSavedProducts();
    localStorage.setItem(EXCHANGE_RATE_STORAGE_KEY, String(cleanRate));
    localStorage.setItem(CATALOG_UPDATED_AT_KEY, String(updatedAt));
    window.dispatchEvent(new Event('catalog_products_updated'));

    persistCatalogToCloud(currentProducts, cleanRate, updatedAt);

    fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: currentProducts,
        exchangeRate: cleanRate,
        updatedAt,
      }),
    }).catch(() => {});
  } catch {
    // Ignore storage errors
  }
}

export function getSavedProducts(): Product[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return DEFAULT_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: Product) => ({
        ...p,
        available: p.available !== false,
        stockNote: p.stockNote || 'Entrega Rápida',
      }));
    }
    return DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export function syncCatalogFromServer(
  serverProducts: Product[],
  serverExchangeRate?: number,
  serverUpdatedAt?: number
): void {
  if (typeof window === 'undefined' || !Array.isArray(serverProducts) || serverProducts.length === 0) {
    return;
  }
  try {
    const localUpdatedAt = getCatalogLastUpdatedAt();
    // Only apply server snapshot if it has a valid timestamp newer than or equal to local
    if (typeof serverUpdatedAt === 'number' && serverUpdatedAt > 0) {
      if (localUpdatedAt > 0 && serverUpdatedAt < localUpdatedAt) {
        return;
      }
    } else if (localUpdatedAt > 0) {
      // Do not let an unversioned default server state overwrite customized local state
      return;
    }

    const normalized = normalizeProductsList(serverProducts);
    const currentRaw = localStorage.getItem(CATALOG_STORAGE_KEY);
    const nextRaw = JSON.stringify(normalized);
    let changed = false;

    if (currentRaw !== nextRaw) {
      localStorage.setItem(CATALOG_STORAGE_KEY, nextRaw);
      changed = true;
    }

    if (typeof serverExchangeRate === 'number' && serverExchangeRate >= 1) {
      const cleanRate = String(Number(serverExchangeRate.toFixed(2)));
      if (localStorage.getItem(EXCHANGE_RATE_STORAGE_KEY) !== cleanRate) {
        localStorage.setItem(EXCHANGE_RATE_STORAGE_KEY, cleanRate);
        changed = true;
      }
    }

    if (typeof serverUpdatedAt === 'number' && serverUpdatedAt > 0) {
      localStorage.setItem(CATALOG_UPDATED_AT_KEY, String(serverUpdatedAt));
    }

    if (changed) {
      window.dispatchEvent(new Event('catalog_products_updated'));
    }
  } catch {
    // Ignore storage errors
  }
}

export function saveProductsCatalog(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeProductsList(products);
    const currentRate = getSavedExchangeRate();
    const updatedAt = Date.now();

    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(CATALOG_UPDATED_AT_KEY, String(updatedAt));
    window.dispatchEvent(new Event('catalog_products_updated'));

    persistCatalogToCloud(normalized, currentRate, updatedAt);

    fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: normalized,
        exchangeRate: currentRate,
        updatedAt,
      }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving products catalog:', e);
  }
}

export function resetProductsToDefault(): Product[] {
  saveProductsCatalog(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export function initCatalogRealtimeSync(): void {
  if (typeof window === 'undefined' || catalogRealtimeUnsubscribe) return;

  testFirestoreConnection();

  const path = 'appConfig/catalog';
  catalogRealtimeUnsubscribe = onSnapshot(
    doc(db, 'appConfig', 'catalog'),
    (snapshot) => {
      if (!snapshot.exists()) {
        // Seed initial cloud catalog from current device state so all devices share the same state
        const initialProducts = getSavedProducts();
        const initialRate = getSavedExchangeRate();
        const initialUpdatedAt = getCatalogLastUpdatedAt() || Date.now();
        persistCatalogToCloud(initialProducts, initialRate, initialUpdatedAt);
        return;
      }

      const data = snapshot.data();
      if (!data || !Array.isArray(data.products) || data.products.length === 0) return;

      const cloudUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : Date.now();
      const cloudRate =
        typeof data.exchangeRate === 'number' && data.exchangeRate >= 1
          ? data.exchangeRate
          : DEFAULT_EXCHANGE_RATE;
      const cloudProducts = normalizeProductsList(data.products as Product[]);

      const currentRaw = localStorage.getItem(CATALOG_STORAGE_KEY);
      const nextRaw = JSON.stringify(cloudProducts);
      const currentRateRaw = localStorage.getItem(EXCHANGE_RATE_STORAGE_KEY);
      const nextRateRaw = String(Number(cloudRate.toFixed(2)));

      let changed = false;
      if (currentRaw !== nextRaw) {
        localStorage.setItem(CATALOG_STORAGE_KEY, nextRaw);
        changed = true;
      }
      if (currentRateRaw !== nextRateRaw) {
        localStorage.setItem(EXCHANGE_RATE_STORAGE_KEY, nextRateRaw);
        changed = true;
      }
      localStorage.setItem(CATALOG_UPDATED_AT_KEY, String(cloudUpdatedAt));

      if (changed) {
        window.dispatchEvent(new Event('catalog_products_updated'));
      }

      // Keep local/serverless backend in sync for AI chatbot queries
      fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: cloudProducts,
          exchangeRate: cloudRate,
          updatedAt: cloudUpdatedAt,
        }),
      }).catch(() => {});
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

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
