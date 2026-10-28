import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  KeyRound,
  Users,
  UserCheck,
  ShieldCheck,
  Package,
  DollarSign,
  Calendar,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Save,
  RotateCcw,
  Star,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  GraduationCap,
  Video,
  LayoutGrid,
  PenTool,
  Palette,
  Bot,
  Cpu,
  Music,
  Globe,
  Tv,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  ArrowRightLeft,
} from 'lucide-react';
import { Product, ScheduleConfig } from '../types';
import {
  getSavedProducts,
  saveProductsCatalog,
  resetProductsToDefault,
  getSavedExchangeRate,
  saveExchangeRate,
  OFFICIAL_BENEFICIARY,
  OFFICIAL_WHATSAPP_NUMBER,
} from '../data/catalog';
import {
  DEFAULT_SCHEDULE_CONFIG,
  getSavedScheduleConfig,
  saveScheduleConfig,
  formatEnabledDaysSummary,
} from '../data/scheduleConfig';
import {
  getMultiUserAdminState,
  verifyOwnerPasswordAsync,
  logoutOwner,
  MultiUserAdminState,
} from '../data/adminAuth';

export type AdminTabType = 'products' | 'prices' | 'schedule' | 'system';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AdminTabType;
  initialEditProduct?: Product | null;
  openCreateNew?: boolean;
  onCatalogUpdated?: (products: Product[]) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Sparkles', label: 'IA / Brillo', icon: Sparkles },
  { id: 'GraduationCap', label: 'Educación', icon: GraduationCap },
  { id: 'Video', label: 'Video / Cine', icon: Video },
  { id: 'LayoutGrid', label: 'Office / Suite', icon: LayoutGrid },
  { id: 'PenTool', label: 'Diseño / Pluma', icon: PenTool },
  { id: 'Palette', label: 'Arte / Canva', icon: Palette },
  { id: 'Bot', label: 'Robot / ChatGPT', icon: Bot },
  { id: 'Cpu', label: 'Tecnología / Chip', icon: Cpu },
  { id: 'Music', label: 'Música / Audio', icon: Music },
  { id: 'Globe', label: 'Idiomas / Web', icon: Globe },
  { id: 'Tv', label: 'Streaming / TV', icon: Tv },
  { id: 'Zap', label: 'Rayo / Express', icon: Zap },
];

const SUGGESTED_CATEGORIES = [
  'Inteligencia Artificial',
  'Diseño UI/UX & Prototipado',
  'Educación & Certificaciones',
  'Edición de Video',
  'Productividad & Nube',
  'Streaming & Entretenimiento',
  'Software & Licencias VIP',
];

const EMPTY_PRODUCT_FORM: Omit<Product, 'id'> = {
  name: '',
  category: 'Inteligencia Artificial',
  priceMxn: 150,
  priceUsd: 8.74,
  currencyType: 'USD',
  description: '',
  highlights: [
    'Acceso oficial garantizado',
    'Soporte directo por WhatsApp',
    'Activación rápida y segura',
  ],
  duration: 'Suscripción Activa',
  iconName: 'Sparkles',
  popular: false,
  available: true,
  promoBadge: '',
  stockNote: 'Entrega Rápida',
};

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'products',
  initialEditProduct = null,
  openCreateNew = false,
  onCatalogUpdated,
}) => {
  const [adminState, setAdminState] = useState<MultiUserAdminState>(() =>
    getMultiUserAdminState()
  );
  const [inputPass, setInputPass] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTabType>(initialTab);
  const [products, setProducts] = useState<Product[]>(() => getSavedProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [exchangeRate, setExchangeRate] = useState<number>(() => getSavedExchangeRate());

  // Product Editor Form State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT_FORM);
  const [newHighlightText, setNewHighlightText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Schedule State
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(() =>
    getSavedScheduleConfig()
  );
  const [newSlotStart, setNewSlotStart] = useState('02:00 PM');
  const [newSlotEnd, setNewSlotEnd] = useState('03:00 PM');

  // Feedback Toasts & Confirmations
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmResetCatalog, setConfirmResetCatalog] = useState(false);
  const [confirmResetSchedule, setConfirmResetSchedule] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    const syncAuth = () => setAdminState(getMultiUserAdminState());
    const syncCatalog = () => setProducts(getSavedProducts());
    const syncSchedule = () => setScheduleConfig(getSavedScheduleConfig());

    window.addEventListener('admin_auth_state_changed', syncAuth);
    window.addEventListener('catalog_products_updated', syncCatalog);
    window.addEventListener('schedule_config_updated', syncSchedule);

    return () => {
      window.removeEventListener('admin_auth_state_changed', syncAuth);
      window.removeEventListener('catalog_products_updated', syncCatalog);
      window.removeEventListener('schedule_config_updated', syncSchedule);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAdminState(getMultiUserAdminState());
      setProducts(getSavedProducts());
      setScheduleConfig(getSavedScheduleConfig());
      setExchangeRate(getSavedExchangeRate());
      setActiveTab(initialTab);
      setInputPass('');
      setPassError(null);
      setDeleteConfirmId(null);

      if (initialEditProduct) {
        openEditForm(initialEditProduct);
      } else if (openCreateNew) {
        openNewProductForm();
      } else {
        setIsEditingProduct(false);
        setEditingProductId(null);
      }
    }
  }, [isOpen, initialTab, initialEditProduct, openCreateNew]);

  if (!isOpen) return null;

  const isAuth = adminState.isAuthenticated;

  const handleUnlockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    setIsVerifying(true);
    setPassError(null);

    const res = await verifyOwnerPasswordAsync(inputPass);
    setIsVerifying(false);

    if (res.ok) {
      setAdminState(getMultiUserAdminState());
      setPassError(null);
      setInputPass('');
      showToast('Sesión Única de Administrador Activada (****)');
    } else {
      setAdminState(getMultiUserAdminState());
      setPassError(res.message || 'Acceso incorrecto. Ingresa ****.');
    }
  };

  const persistProducts = (updated: Product[], notificationText?: string) => {
    setProducts(updated);
    saveProductsCatalog(updated);
    if (onCatalogUpdated) onCatalogUpdated(updated);
    if (notificationText) showToast(notificationText);
  };

  const openNewProductForm = () => {
    setEditingProductId(null);
    setFormState({
      ...EMPTY_PRODUCT_FORM,
      highlights: [...EMPTY_PRODUCT_FORM.highlights],
    });
    setNewHighlightText('');
    setIsEditingProduct(true);
    setActiveTab('products');
  };

  const openEditForm = (product: Product) => {
    setEditingProductId(product.id);
    setFormState({
      name: product.name,
      category: product.category,
      priceMxn: product.priceMxn,
      priceUsd: product.priceUsd,
      currencyType: product.currencyType,
      description: product.description,
      highlights: [...product.highlights],
      duration: product.duration,
      iconName: product.iconName || 'Sparkles',
      popular: Boolean(product.popular),
      available: product.available !== false,
      promoBadge: product.promoBadge || '',
      stockNote: product.stockNote || 'Entrega Rápida',
    });
    setNewHighlightText('');
    setIsEditingProduct(true);
    setActiveTab('products');
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const cleanHighlights = formState.highlights
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    if (editingProductId) {
      const updated = products.map((p) =>
        p.id === editingProductId
          ? {
              ...formState,
              id: editingProductId,
              name: formState.name.trim(),
              priceMxn: Math.max(0, Number(formState.priceMxn) || 0),
              priceUsd: Math.max(0, Number(Number(formState.priceUsd || 0).toFixed(2))),
              highlights:
                cleanHighlights.length > 0
                  ? cleanHighlights
                  : ['Acceso oficial garantizado con soporte por WhatsApp'],
            }
          : p
      );
      persistProducts(updated, `¡Producto "${formState.name.trim()}" actualizado!`);
    } else {
      const slugBase = formState.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const newId = `${slugBase || 'producto'}-${Date.now().toString().slice(-4)}`;
      const newProduct: Product = {
        ...formState,
        id: newId,
        name: formState.name.trim(),
        priceMxn: Math.max(0, Number(formState.priceMxn) || 0),
        priceUsd: Math.max(0, Number(Number(formState.priceUsd || 0).toFixed(2))),
        highlights:
          cleanHighlights.length > 0
            ? cleanHighlights
            : ['Acceso oficial garantizado con soporte por WhatsApp'],
      };
      persistProducts([newProduct, ...products], `¡Producto "${newProduct.name}" agregado al catálogo!`);
    }

    setIsEditingProduct(false);
    setEditingProductId(null);
  };

  const handleDuplicateProduct = (product: Product) => {
    const dupProduct: Product = {
      ...product,
      id: `${product.id}-copia-${Date.now().toString().slice(-3)}`,
      name: `${product.name} (Nuevo)`,
    };
    persistProducts([dupProduct, ...products], `¡"${product.name}" duplicado! Ahora puedes editarlo.`);
  };

  const handleDeleteProduct = (productId: string) => {
    if (deleteConfirmId !== productId) {
      setDeleteConfirmId(productId);
      setTimeout(() => setDeleteConfirmId(null), 4000);
      return;
    }
    const target = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setDeleteConfirmId(null);
    persistProducts(updated, `Producto "${target?.name || ''}" eliminado.`);
  };

  const handleTogglePopular = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, popular: !p.popular } : p
    );
    persistProducts(updated, 'Etiqueta de destacado actualizada.');
  };

  const handleToggleAvailable = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, available: p.available === false ? true : false } : p
    );
    persistProducts(updated, 'Disponibilidad del producto actualizada.');
  };

  // Price table handlers
  const handleQuickPriceChange = (
    productId: string,
    field: 'priceMxn' | 'priceUsd' | 'currencyType' | 'duration' | 'stockNote',
    value: string | number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (field === 'priceMxn') {
          const mxn = Math.max(0, Number(value) || 0);
          return { ...p, priceMxn: mxn };
        }
        if (field === 'priceUsd') {
          const usd = Math.max(0, Number(value) || 0);
          return { ...p, priceUsd: usd };
        }
        if (field === 'currencyType') {
          return { ...p, currencyType: value === 'USDT' ? 'USDT' : 'USD' };
        }
        if (field === 'duration') {
          return { ...p, duration: String(value) };
        }
        if (field === 'stockNote') {
          return { ...p, stockNote: String(value) };
        }
        return p;
      })
    );
  };

  const handleRecalculateAllUsdFromMxn = () => {
    const safeRate = Math.max(1, Number(exchangeRate) || 17.16);
    saveExchangeRate(safeRate);
    const updated = products.map((p) => ({
      ...p,
      priceUsd: Number((p.priceMxn / safeRate).toFixed(2)),
    }));
    persistProducts(
      updated,
      `¡Precios USD/USDT recalculados con tipo de cambio $${safeRate.toFixed(2)} MXN!`
    );
  };

  const handleMassAdjustPrices = (percentOrDelta: number, mode: 'mxn_delta' | 'percent') => {
    const safeRate = Math.max(1, Number(exchangeRate) || 17.16);
    const updated = products.map((p) => {
      let nextMxn = p.priceMxn;
      if (mode === 'mxn_delta') {
        nextMxn = Math.max(10, Math.round(p.priceMxn + percentOrDelta));
      } else {
        nextMxn = Math.max(10, Math.round(p.priceMxn * (1 + percentOrDelta / 100)));
      }
      const nextUsd = Number((nextMxn / safeRate).toFixed(2));
      return {
        ...p,
        priceMxn: nextMxn,
        priceUsd: nextUsd,
      };
    });
    persistProducts(updated, '¡Ajuste masivo de precios aplicado y guardado!');
  };

  const handleSaveAllQuickPrices = () => {
    persistProducts(products, '¡Todos los precios y tarifas han sido guardados en vivo!');
  };

  const handleRestoreDefaultCatalog = () => {
    if (!confirmResetCatalog) {
      setConfirmResetCatalog(true);
      setTimeout(() => setConfirmResetCatalog(false), 4000);
      return;
    }
    const defaults = resetProductsToDefault();
    setProducts(defaults);
    setConfirmResetCatalog(false);
    if (onCatalogUpdated) onCatalogUpdated(defaults);
    showToast('¡Catálogo restaurado a los 12 productos oficiales predeterminados!');
  };

  // Schedule handlers
  const handleToggleDay = (dayId: string) => {
    setScheduleConfig((prev) => ({
      ...prev,
      availableDays: prev.availableDays.map((d) =>
        d.dayId === dayId ? { ...d, enabled: !d.enabled } : d
      ),
    }));
  };

  const handleAddSlot = () => {
    const formatted = `${newSlotStart.trim()} - ${newSlotEnd.trim()}`;
    if (newSlotStart.trim() && newSlotEnd.trim() && !scheduleConfig.timeSlots.includes(formatted)) {
      setScheduleConfig((prev) => ({
        ...prev,
        timeSlots: [...prev.timeSlots, formatted],
      }));
    }
  };

  const handleRemoveSlot = (idx: number) => {
    setScheduleConfig((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveSchedule = () => {
    saveScheduleConfig(scheduleConfig);
    showToast('¡Días y horarios de atención guardados exitosamente!');
  };

  const handleResetSchedule = () => {
    if (!confirmResetSchedule) {
      setConfirmResetSchedule(true);
      setTimeout(() => setConfirmResetSchedule(false), 4000);
      return;
    }
    setScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    saveScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    setConfirmResetSchedule(false);
    showToast('Horarios restaurados a los valores predeterminados.');
  };

  const categoriesList = [
    'todas',
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'todas' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const daysSummary = formatEnabledDaysSummary(scheduleConfig.availableDays);

  const renderIconPreview = (iconName: string, className = 'w-5 h-5') => {
    const found = AVAILABLE_ICONS.find((i) => i.id === iconName);
    const IconComp = found ? found.icon : Sparkles;
    return <IconComp className={className} />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                  Centro de Administración Total (****)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Titular: {OFFICIAL_BENEFICIARY}
                </span>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {adminState.activeUsersCount} usuario(s) en línea
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Agrega productos, edita precios en MXN y USD/USDT, administra horarios y controla tu catálogo en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuth && (
              <button
                type="button"
                onClick={() => {
                  logoutOwner('manual');
                  setAdminState(getMultiUserAdminState());
                }}
                className="text-xs font-bold text-red-300 hover:text-white bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cerrar sesión única de administrador"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión (****)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Authentication Gate if not logged in */}
        {!isAuth ? (
          <div className="p-8 sm:p-12 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                Acceso Exclusivo de Administrador (1/1) • ****
              </span>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                Ingresa tu Clave de Administrador (****)
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Desbloquea el panel para <strong>agregar más productos</strong>, <strong>editar precios en MXN y USD/USDT</strong>, destacar servicios y administrar tus horarios.
              </p>
            </div>

            {adminState.isAdminOccupiedByOther && (
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5 text-left">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block">
                    Administrador Conectado en Otra Sesión (1/1 Activo)
                  </strong>
                  <span>
                    Solo se permite 1 administrador conectado a la vez. Mientras el administrador actual esté activo, las demás sesiones permanecen en modo cliente normal.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleUnlockModal} className="max-w-xs mx-auto space-y-3 pt-2">
              <input
                type="password"
                placeholder="****"
                value={inputPass}
                onChange={(e) => {
                  setInputPass(e.target.value);
                  if (passError) setPassError(null);
                }}
                autoComplete="off"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-base text-white px-4 py-3 rounded-2xl outline-none text-center tracking-widest placeholder:tracking-widest"
              />

              {passError && (
                <div className="text-xs text-red-400 bg-red-500/10 py-2.5 px-3 rounded-xl border border-red-500/20">
                  {passError}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isVerifying ? 'Verificando Clave...' : 'Entrar al Panel Admin (****)'}
                </span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Ningún cliente puede ver tu clave • Sesión única protegida con cierre automático al salir
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    setIsEditingProduct(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Productos ({products.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('prices');
                    setIsEditingProduct(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'prices'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Editar Precios Rápido</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('schedule');
                    setIsEditingProduct(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'schedule'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Horarios y Citas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('system');
                    setIsEditingProduct(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Respaldo y Control</span>
                </button>
              </div>

              <button
                type="button"
                onClick={openNewProductForm}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Agregar Nuevo Producto</span>
              </button>
            </div>

            {/* Main Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* ============================================================ */}
              {/* TAB 1: PRODUCTS CRUD & FORM                                  */}
              {/* ============================================================ */}
              {activeTab === 'products' && (
                <>
                  {isEditingProduct ? (
                    <form
                      onSubmit={handleSaveProductForm}
                      className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            {editingProductId ? 'Editando Producto Existente' : 'Nuevo Producto Oficial'}
                          </span>
                          <h4 className="text-lg font-extrabold text-white mt-1">
                            {editingProductId
                              ? `Modificar: ${formState.name || 'Producto'}`
                              : 'Crear y Publicar Nuevo Producto'}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProduct(false);
                            setEditingProductId(null);
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
                        >
                          ← Volver a la lista
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Nombre del Producto / Servicio *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. ChatGPT Plus / Canva Pro / Spotify Anual..."
                            value={formState.name}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 text-sm text-white px-3.5 py-2.5 rounded-xl outline-none"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Categoría
                          </label>
                          <input
                            type="text"
                            list="sdp-categories-list"
                            placeholder="Ej. Inteligencia Artificial"
                            value={formState.category}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, category: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 text-sm text-white px-3.5 py-2.5 rounded-xl outline-none"
                          />
                          <datalist id="sdp-categories-list">
                            {SUGGESTED_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Pricing & Duration Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                        <div>
                          <label className="block text-xs font-bold text-emerald-400 mb-1">
                            Precio en Pesos ($ MXN) *
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            required
                            value={formState.priceMxn}
                            onChange={(e) => {
                              const mxn = Number(e.target.value) || 0;
                              const autoUsd = Number((mxn / (exchangeRate || 17.16)).toFixed(2));
                              setFormState((prev) => ({
                                ...prev,
                                priceMxn: mxn,
                                priceUsd: autoUsd,
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 text-base font-black text-white px-3.5 py-2 rounded-xl outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-cyan-400 mb-1">
                            Precio en Dólares ($ USD/USDT) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formState.priceUsd}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                priceUsd: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-base font-black text-emerald-300 px-3.5 py-2 rounded-xl outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Moneda Internacional
                          </label>
                          <select
                            value={formState.currencyType}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                currencyType: e.target.value as 'USD' | 'USDT',
                              }))
                            }
                            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 text-sm text-white px-3 py-2.5 rounded-xl outline-none"
                          >
                            <option value="USD">USD (Dólares)</option>
                            <option value="USDT">USDT (Binance / Cripto)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Duración / Vigencia
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Suscripción 1 Mes / 2 Años"
                            value={formState.duration}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, duration: e.target.value }))
                            }
                            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 text-sm text-white px-3.5 py-2 rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Descripción Comercial del Producto
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Describe brevemente qué incluye la cuenta o licencia..."
                          value={formState.description}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl outline-none resize-none"
                        />
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">
                          Icono Visual para la Tarjeta
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {AVAILABLE_ICONS.map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = formState.iconName === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setFormState((prev) => ({ ...prev, iconName: item.id }))
                                }
                                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                                <span className="text-[10px] truncate w-full text-center">
                                  {item.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Highlights / Benefits */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300">
                          Beneficios / Puntos Clave Incluidos ({formState.highlights.length})
                        </label>
                        <div className="space-y-2">
                          {formState.highlights.map((hl, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={hl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormState((prev) => ({
                                    ...prev,
                                    highlights: prev.highlights.map((item, i) =>
                                      i === idx ? val : item
                                    ),
                                  }));
                                }}
                                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-400 text-xs text-white px-3 py-2 rounded-xl outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setFormState((prev) => ({
                                    ...prev,
                                    highlights: prev.highlights.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer"
                                title="Quitar beneficio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Agregar otro beneficio (ej. Entrega inmediata en tu correo)..."
                            value={newHighlightText}
                            onChange={(e) => setNewHighlightText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newHighlightText.trim()) {
                                  setFormState((prev) => ({
                                    ...prev,
                                    highlights: [...prev.highlights, newHighlightText.trim()],
                                  }));
                                  setNewHighlightText('');
                                }
                              }
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newHighlightText.trim()) {
                                setFormState((prev) => ({
                                  ...prev,
                                  highlights: [...prev.highlights, newHighlightText.trim()],
                                }));
                                setNewHighlightText('');
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir Punto</span>
                          </button>
                        </div>
                      </div>

                      {/* Badges & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Etiqueta Superior (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Más Solicitado / Oferta"
                            value={formState.promoBadge || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, promoBadge: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Nota de Entrega / Stock
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Entrega Rápida"
                            value={formState.stockNote || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, stockNote: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none"
                          />
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(formState.popular)}
                              onChange={(e) =>
                                setFormState((prev) => ({ ...prev, popular: e.target.checked }))
                              }
                              className="rounded accent-emerald-500 w-4 h-4"
                            />
                            <span>Destacar producto (Borde Esmeralda)</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formState.available !== false}
                              onChange={(e) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  available: e.target.checked,
                                }))
                              }
                              className="rounded accent-emerald-500 w-4 h-4"
                            />
                            <span>Disponible para venta inmediata</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProduct(false);
                            setEditingProductId(null);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>
                            {editingProductId ? 'Guardar Cambios del Producto' : 'Publicar Producto Ahora'}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Search & Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar producto por nombre, categoría o descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 px-3 py-2 rounded-xl outline-none"
                          >
                            {categoriesList.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat === 'todas' ? '📂 Todas las Categorías' : cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Products Admin List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredProducts.map((product) => {
                          const isAvail = product.available !== false;
                          return (
                            <div
                              key={product.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                !isAvail
                                  ? 'bg-slate-950/50 border-slate-800/60 opacity-75'
                                  : product.popular
                                  ? 'bg-slate-950 border-emerald-500/40'
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                                    {renderIconPreview(product.iconName)}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h5 className="font-extrabold text-sm text-white">
                                        {product.name}
                                      </h5>
                                      {product.popular && (
                                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                          ★ Destacado
                                        </span>
                                      )}
                                      {!isAvail && (
                                        <span className="text-[10px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                                          Agotado / Oculto
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      {product.category} • {product.duration}
                                    </p>
                                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                                      {product.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-base font-black text-white">
                                    ${product.priceMxn}{' '}
                                    <span className="text-[10px] font-normal text-slate-400">
                                      MXN
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-emerald-400">
                                    ${Number(product.priceUsd).toFixed(2)} {product.currencyType}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditForm(product)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar Todo</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePopular(product.id)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                      product.popular
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                    }`}
                                    title="Marcar o quitar como Más Solicitado"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    <span>{product.popular ? 'Destacado' : 'Destacar'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleAvailable(product.id)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                      isAvail
                                        ? 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                                    }`}
                                    title="Cambiar disponibilidad"
                                  >
                                    {isAvail ? (
                                      <>
                                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Activo</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-3.5 h-3.5 text-red-400" />
                                        <span>Pausado</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateProduct(product)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                                    title="Duplicar este producto"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                      deleteConfirmId === product.id
                                        ? 'bg-red-500 text-slate-950 border-red-400'
                                        : 'bg-slate-900 hover:bg-red-500/15 text-slate-400 hover:text-red-400 border-slate-800'
                                    }`}
                                    title="Eliminar producto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deleteConfirmId === product.id && <span>¿Confirmar?</span>}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ============================================================ */}
              {/* TAB 2: QUICK PRICE EDITOR & MASS TOOLS                       */}
              {/* ============================================================ */}
              {activeTab === 'prices' && (
                <div className="space-y-5">
                  {/* Exchange Rate & Mass Price Tools */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                        <Calculator className="w-4 h-4" />
                        <span>Calculadora de Tipo de Cambio y Ajuste Rápido</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Modifica cualquier precio en la tabla inferior o recalcula automáticamente los precios en USD/USDT según el tipo de cambio.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                        <span className="text-xs text-slate-400 font-semibold">1 USD =</span>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(Number(e.target.value) || 17.16)}
                          className="w-16 bg-slate-950 text-white font-bold text-xs px-2 py-1 rounded border border-slate-700 outline-none text-center"
                        />
                        <span className="text-xs text-slate-400 font-semibold">MXN</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRecalculateAllUsdFromMxn}
                        className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Calcular USD desde MXN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMassAdjustPrices(-10, 'mxn_delta')}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                        title="Bajar $10 MXN a todos los productos"
                      >
                        -$10 MXN
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMassAdjustPrices(10, 'mxn_delta')}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                        title="Subir $10 MXN a todos los productos"
                      >
                        +$10 MXN
                      </button>
                    </div>
                  </div>

                  {/* Spreadsheet-style Price Editor */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-extrabold uppercase text-slate-400">
                            <th className="py-3 px-4">Producto</th>
                            <th className="py-3 px-3">Precio MXN ($)</th>
                            <th className="py-3 px-3">Precio USD/USDT ($)</th>
                            <th className="py-3 px-3">Moneda</th>
                            <th className="py-3 px-3">Vigencia / Duración</th>
                            <th className="py-3 px-3 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-xs">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-900/40">
                              <td className="py-3 px-4 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-400">
                                    {renderIconPreview(product.iconName, 'w-4 h-4')}
                                  </span>
                                  <span>{product.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold">$</span>
                                  <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={product.priceMxn}
                                    onChange={(e) =>
                                      handleQuickPriceChange(
                                        product.id,
                                        'priceMxn',
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-slate-900 border border-slate-700 focus:border-emerald-400 text-white font-black text-xs px-2.5 py-1.5 rounded-lg outline-none"
                                  />
                                  <span className="text-[10px] text-slate-500">MXN</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-emerald-400 font-bold">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={product.priceUsd}
                                    onChange={(e) =>
                                      handleQuickPriceChange(
                                        product.id,
                                        'priceUsd',
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-slate-900 border border-slate-700 focus:border-cyan-400 text-emerald-300 font-black text-xs px-2.5 py-1.5 rounded-lg outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={product.currencyType}
                                  onChange={(e) =>
                                    handleQuickPriceChange(
                                      product.id,
                                      'currencyType',
                                      e.target.value
                                    )
                                  }
                                  className="bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none"
                                >
                                  <option value="USD">USD</option>
                                  <option value="USDT">USDT</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={product.duration}
                                  onChange={(e) =>
                                    handleQuickPriceChange(
                                      product.id,
                                      'duration',
                                      e.target.value
                                    )
                                  }
                                  className="w-40 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAvailable(product.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                    product.available !== false
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-red-500/15 text-red-300 border-red-500/30'
                                  }`}
                                >
                                  {product.available !== false ? 'Disponible' : 'Agotado'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        Los cambios se reflejan al instante en el Catálogo, Carrito, Cotizador de WhatsApp y Asistente IA.
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveAllQuickPrices}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Todos los Precios Ahora</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: SCHEDULE & BOT CONFIG                                 */}
              {/* ============================================================ */}
              {activeTab === 'schedule' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 font-bold block mb-0.5">
                        Protocolo Automático de 3 a 5 Minutos ({OFFICIAL_WHATSAPP_NUMBER})
                      </strong>
                      <span>
                        Si un cliente escribe y no puedes responderle en 3 a 5 minutos, el bot agenda cita automáticamente en los días y turnos que habilites aquí.
                      </span>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span>1. Días Disponibles para Atención:</span>
                      </label>
                      <span className="text-xs text-slate-400">
                        Activos: <strong className="text-emerald-400">{daysSummary}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {scheduleConfig.availableDays.map((day) => (
                        <button
                          key={day.dayId}
                          type="button"
                          onClick={() => handleToggleDay(day.dayId)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                            day.enabled
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          <span>{day.name}</span>
                          <span className="text-[10px] opacity-80">
                            {day.enabled ? '✓ Activo' : 'Cerrado'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>
                        2. Horarios y Turnos de Entrega ({scheduleConfig.timeSlots.length} activos):
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {scheduleConfig.timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="font-semibold">{slot}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(index)}
                            className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                            title="Eliminar turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Nuevo turno:</span>
                      <input
                        type="text"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-28 bg-slate-950 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none"
                      />
                      <span className="text-xs text-slate-500">a</span>
                      <input
                        type="text"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-28 bg-slate-950 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSlot}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Horario</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleResetSchedule}
                        className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                          confirmResetSchedule
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>
                          {confirmResetSchedule
                            ? '¿Confirmar Restaurar Horarios?'
                            : 'Restaurar Horarios Predeterminados'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSchedule}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Configuración de Horarios</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: SYSTEM SUMMARY & BACKUP                               */}
              {/* ============================================================ */}
              {activeTab === 'system' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Total en Catálogo
                      </span>
                      <div className="text-2xl font-black text-white mt-1">
                        {products.length} Productos
                      </div>
                      <span className="text-[11px] text-emerald-400">
                        {products.filter((p) => p.available !== false).length} activos para venta
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Productos Destacados
                      </span>
                      <div className="text-2xl font-black text-amber-400 mt-1">
                        {products.filter((p) => p.popular).length} VIP
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Con insignia de Más Solicitado
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Usuarios Conectados
                      </span>
                      <div className="text-2xl font-black text-cyan-400 mt-1">
                        {adminState.activeUsersCount} en línea
                      </div>
                      <span className="text-[11px] text-emerald-400">
                        Sesión Única Admin (1/1 • ****)
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Canal Oficial
                      </span>
                      <div className="text-base font-black text-white mt-1">
                        {OFFICIAL_WHATSAPP_NUMBER}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {OFFICIAL_BENEFICIARY}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-extrabold text-white">
                      Herramientas de Mantenimiento y Respaldo del Catálogo
                    </h4>
                    <p className="text-xs text-slate-400">
                      Puedes copiar un respaldo en formato JSON de tus productos y precios actuales, o restaurar el catálogo original de 12 productos oficiales en cualquier momento.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(JSON.stringify(products, null, 2));
                            setCopiedJson(true);
                            setTimeout(() => setCopiedJson(false), 2500);
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        {copiedJson ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">¡Catálogo Copiado al Portapapeles!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-cyan-400" />
                            <span>Copiar Respaldo JSON de Productos</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRestoreDefaultCatalog}
                        className={`text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                          confirmResetCatalog
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>
                          {confirmResetCatalog
                            ? '¿Confirmar Restaurar los 12 Productos Originales?'
                            : 'Restaurar Catálogo Predeterminado (12 Productos)'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
