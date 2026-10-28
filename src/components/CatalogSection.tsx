import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Video,
  LayoutGrid,
  PenTool,
  Palette,
  Bot,
  Cpu,
  Music,
  Globe,
  Tv,
  CheckCircle2,
  MessageCircle,
  Plus,
  AlertTriangle,
  Zap,
  Lock,
  Unlock,
  Edit3,
  DollarSign,
  Trash2,
  Star,
  Check,
  Search,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Product, CountryCode } from '../types';
import {
  getSavedProducts,
  saveProductsCatalog,
  buildWhatsAppLink,
} from '../data/catalog';
import {
  getMultiUserAdminState,
  MultiUserAdminState,
} from '../data/adminAuth';
import { AdminControlModal, AdminTabType } from './AdminControlModal';

interface CatalogSectionProps {
  country: CountryCode;
  onAddToCart: (product: Product) => void;
  onOpenOrderModal: (product: Product) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  country,
  onAddToCart,
}) => {
  const [products, setProducts] = useState<Product[]>(() => getSavedProducts());
  const [adminState, setAdminState] = useState<MultiUserAdminState>(() =>
    getMultiUserAdminState()
  );
  const [currencyView, setCurrencyView] = useState<'both' | 'mxn' | 'usd'>('both');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Inline quick price edit state for Admin
  const [inlinePriceEditId, setInlinePriceEditId] = useState<string | null>(null);
  const [inlineMxn, setInlineMxn] = useState<number>(150);
  const [inlineUsd, setInlineUsd] = useState<number>(8.74);
  const [inlineDeleteConfirmId, setInlineDeleteConfirmId] = useState<string | null>(null);

  // Admin Modal state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<AdminTabType>('products');
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [openCreateInModal, setOpenCreateInModal] = useState(false);

  useEffect(() => {
    const handleCatalogUpdate = () => setProducts(getSavedProducts());
    const handleAuthUpdate = () => setAdminState(getMultiUserAdminState());

    window.addEventListener('catalog_products_updated', handleCatalogUpdate);
    window.addEventListener('admin_auth_state_changed', handleAuthUpdate);

    return () => {
      window.removeEventListener('catalog_products_updated', handleCatalogUpdate);
      window.removeEventListener('admin_auth_state_changed', handleAuthUpdate);
    };
  }, []);

  const isAdmin = adminState.isAuthenticated;

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-blue-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'Video':
        return <Video className="w-6 h-6 text-pink-400" />;
      case 'LayoutGrid':
        return <LayoutGrid className="w-6 h-6 text-cyan-400" />;
      case 'PenTool':
        return <PenTool className="w-6 h-6 text-emerald-400" />;
      case 'Palette':
        return <Palette className="w-6 h-6 text-rose-400" />;
      case 'Bot':
        return <Bot className="w-6 h-6 text-teal-400" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-indigo-400" />;
      case 'Music':
        return <Music className="w-6 h-6 text-red-400" />;
      case 'Globe':
        return <Globe className="w-6 h-6 text-lime-400" />;
      case 'Tv':
        return <Tv className="w-6 h-6 text-amber-400" />;
      default:
        return <Zap className="w-6 h-6 text-amber-400" />;
    }
  };

  const openAdminModal = (
    tab: AdminTabType = 'products',
    editProd: Product | null = null,
    createNew = false
  ) => {
    setAdminModalTab(tab);
    setProductToEdit(editProd);
    setOpenCreateInModal(createNew);
    setIsAdminModalOpen(true);
  };

  const handleStartInlinePriceEdit = (product: Product) => {
    setInlinePriceEditId(product.id);
    setInlineMxn(product.priceMxn);
    setInlineUsd(product.priceUsd);
  };

  const handleSaveInlinePrice = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            priceMxn: Math.max(0, Number(inlineMxn) || 0),
            priceUsd: Math.max(0, Number(Number(inlineUsd || 0).toFixed(2))),
          }
        : p
    );
    setProducts(updated);
    saveProductsCatalog(updated);
    setInlinePriceEditId(null);
  };

  const handleQuickTogglePopular = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, popular: !p.popular } : p
    );
    setProducts(updated);
    saveProductsCatalog(updated);
  };

  const handleQuickToggleAvailable = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, available: p.available === false ? true : false } : p
    );
    setProducts(updated);
    saveProductsCatalog(updated);
  };

  const handleQuickDelete = (productId: string) => {
    if (inlineDeleteConfirmId !== productId) {
      setInlineDeleteConfirmId(productId);
      setTimeout(() => setInlineDeleteConfirmId(null), 3500);
      return;
    }
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProductsCatalog(updated);
    setInlineDeleteConfirmId(null);
  };

  // Visible products: Admin sees all (including paused/out-of-stock), normal users see available ones
  const baseProducts = isAdmin
    ? products
    : products.filter((p) => p.available !== false);

  const categories = [
    'Todos',
    ...Array.from(new Set(baseProducts.map((p) => p.category))),
  ];

  const displayedProducts = baseProducts.filter((p) => {
    const matchCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <section id="catalogo" className="py-16 sm:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Management Bar */}
        <div
          className={`mb-8 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
            isAdmin
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isAdmin
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {isAdmin
                    ? 'Modo Administrador Activo: Edición en Vivo de Productos y Precios'
                    : 'Administración de Catálogo, Nuevos Productos y Precios (****)'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {products.length} productos registrados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Puedes agregar más productos, cambiar precios en MXN o USD/USDT directamente en cada tarjeta o abrir el panel completo.'
                  : 'Exclusivo para el titular: desbloquea con tu clave (****) para agregar productos, editar precios y administrar todo el catálogo.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => openAdminModal('products', null, true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Agregar Producto</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAdminModal('prices')}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Editar Precios Rápido</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAdminModal('products')}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Panel Admin</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAdminModal('products')}
                className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Administrar Productos y Precios (****)</span>
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 mb-2">
              <Zap className="w-3.5 h-3.5" /> Catálogo Oficial & Tarifas Actualizadas
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Herramientas Digitales de Alto Rendimiento
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
              Precios exactos sin cargos ocultos. Cuentas directas y garantizadas con soporte oficial por WhatsApp.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center self-start md:self-auto bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <span className="text-xs font-semibold text-slate-400 px-2">Moneda:</span>
            <button
              onClick={() => setCurrencyView('both')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currencyView === 'both'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MXN & USDT
            </button>
            <button
              onClick={() => setCurrencyView('mxn')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currencyView === 'mxn'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sólo MXN
            </button>
            <button
              onClick={() => setCurrencyView('usd')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currencyView === 'usd'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sólo USDT/USD
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar servicio o herramienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => {
            const isAvailable = product.available !== false;
            const isEditingPriceHere = isAdmin && inlinePriceEditId === product.id;

            const waInquiry = buildWhatsAppLink(
              `¡Hola! Vengo del catálogo oficial de Servicios Digitales Premium. Me interesa adquirir: *${product.name}* ($${product.priceMxn} MXN / $${Number(product.priceUsd).toFixed(2)} ${product.currencyType}). ¿Tienen disponibilidad para entrega inmediata?`
            );

            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between bg-slate-900/80 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
                  !isAvailable
                    ? 'border-red-500/30 opacity-80'
                    : product.popular
                    ? 'border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular or Promo Badge */}
                {(product.popular || product.promoBadge) && (
                  <div className="absolute top-0 right-0 z-10">
                    <span className="bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl shadow-md">
                      {product.promoBadge || 'Más Solicitado'}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Admin Quick Controls Bar inside card */}
                  {isAdmin && (
                    <div className="mb-4 pb-3 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openAdminModal('products', product, false)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Editar nombre, descripción, beneficios y precios"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            isEditingPriceHere
                              ? setInlinePriceEditId(null)
                              : handleStartInlinePriceEdit(product)
                          }
                          className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Cambio rápido de precio aquí mismo"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Precio</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickTogglePopular(product.id)}
                          className={`p-1.5 rounded-lg border text-[11px] cursor-pointer ${
                            product.popular
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                          title="Destacar / quitar destacado"
                        >
                          <Star className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickToggleAvailable(product.id)}
                          className={`p-1.5 rounded-lg border text-[11px] cursor-pointer ${
                            isAvailable
                              ? 'bg-slate-800 text-emerald-400 border-slate-700'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                          title={isAvailable ? 'Pausar / marcar agotado' : 'Activar disponible'}
                        >
                          {isAvailable ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickDelete(product.id)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                            inlineDeleteConfirmId === product.id
                              ? 'bg-red-500 text-slate-950 border-red-400'
                              : 'bg-slate-800 text-slate-400 hover:text-red-400 border-slate-700'
                          }`}
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3 h-3" />
                          {inlineDeleteConfirmId === product.id && <span>¿Borrar?</span>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner">
                      {getProductIcon(product.iconName)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/40">
                        {product.duration}
                      </span>
                      <span className="text-[10px] text-emerald-400/90 font-medium">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white tracking-tight">{product.name}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[40px]">
                    {product.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-5 space-y-2 pt-4 border-t border-slate-800/80">
                    {product.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Actions Footer */}
                <div className="p-6 pt-0 mt-2 bg-gradient-to-b from-transparent to-slate-950/40">
                  {/* Inline Quick Price Editor for Admin */}
                  {isEditingPriceHere ? (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/50 mb-4 space-y-2.5">
                      <div className="text-[10px] font-extrabold uppercase text-amber-400 flex items-center justify-between">
                        <span>Editar Precio en Vivo</span>
                        <button
                          type="button"
                          onClick={() => setInlinePriceEditId(null)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Precio MXN ($)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={inlineMxn}
                            onChange={(e) => setInlineMxn(Number(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 text-white font-black text-xs px-2.5 py-1.5 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Precio {product.currencyType} ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inlineUsd}
                            onChange={(e) => setInlineUsd(Number(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-black text-xs px-2.5 py-1.5 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveInlinePrice(product.id)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar Nuevo Precio</span>
                      </button>
                    </div>
                  ) : (
                    /* Standard Price Box */
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Inversión Oficial
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          {(currencyView === 'both' || currencyView === 'mxn') && (
                            <span className="text-2xl font-black text-white">
                              ${product.priceMxn}{' '}
                              <span className="text-xs font-semibold text-slate-400">MXN</span>
                            </span>
                          )}
                          {currencyView === 'both' && (
                            <span className="text-slate-600 font-medium">/</span>
                          )}
                          {(currencyView === 'both' || currencyView === 'usd') && (
                            <span className="text-lg font-bold text-emerald-400">
                              ${Number(product.priceUsd).toFixed(2)}{' '}
                              <span className="text-xs font-semibold text-emerald-500/80">
                                {product.currencyType}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isAvailable
                              ? 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-red-300 bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          {isAvailable ? product.stockNote || 'Entrega Rápida' : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={!isAvailable}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 active:scale-95 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Agregar' : 'Sin Stock'}</span>
                    </button>

                    <a
                      href={waInquiry}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Extra Add Product Card when Admin is Authenticated */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => openAdminModal('products', null, true)}
              className="min-h-[340px] rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-900/40 hover:bg-slate-900/80 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">
                  + Agregar Nuevo Producto
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Haz clic aquí para añadir otro servicio digital, definir su precio en MXN y USD/USDT y publicarlo al instante.
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Reminder note */}
        <div className="mt-10 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 text-center">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Recordatorio:</strong> Todos los pedidos se activan y entregan por medio de nuestro canal oficial de WhatsApp.
          </span>
        </div>
      </div>

      {/* Central Admin Control Modal */}
      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setProductToEdit(null);
          setOpenCreateInModal(false);
        }}
        initialTab={adminModalTab}
        initialEditProduct={productToEdit}
        openCreateNew={openCreateInModal}
        onCatalogUpdated={(updated) => setProducts(updated)}
      />
    </section>
  );
};
