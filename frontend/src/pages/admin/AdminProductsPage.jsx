import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  Sparkles,
  Award,
  Eye,
  EyeOff,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';
import { validateImageFileClient, prepareImageForUpload } from '../../utils/imageUpload';
import ProductPlaceholder from '../../components/common/ProductPlaceholder';
import { formatProductPrice } from '../../components/common/ProductCard';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [badgeFilter, setBadgeFilter] = useState('all'); // 'all' | 'featured' | 'best_seller' | 'hidden'

  // Modal state for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Product Form State
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    price_note: '',
    description: '',
    display_order: 0,
    is_published: true,
    is_featured: false,
    is_best_seller: false,
    is_sold_out_today: false,
    is_archived: false,
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [removeMainImage, setRemoveMainImage] = useState(false);
  const [variants, setVariants] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [formError, setFormError] = useState('');

  const loadData = async (archivedMode = showArchived) => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        adminApi.getProducts(archivedMode),
        adminApi.getCategories(),
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load products.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(showArchived);
  }, [showArchived]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: categories[0]?.id || '',
      price: '',
      price_note: '',
      description: '',
      display_order: products.length + 1,
      is_published: true,
      is_featured: false,
      is_best_seller: false,
      is_sold_out_today: false,
      is_archived: false,
    });
    setMainImageFile(null);
    setMainImagePreview(null);
    setRemoveMainImage(false);
    setVariants([]);
    setGalleryFiles([]);
    setExistingGallery([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      price: product.price !== null && product.price !== undefined ? product.price : '',
      price_note: product.price_note || '',
      description: product.description || '',
      display_order: product.display_order ?? 0,
      is_published: Boolean(product.is_published),
      is_featured: Boolean(product.is_featured),
      is_best_seller: Boolean(product.is_best_seller),
      is_sold_out_today: Boolean(product.is_sold_out_today),
      is_archived: Boolean(product.is_archived),
    });
    setMainImageFile(null);
    setMainImagePreview(product.main_image_url || null);
    setRemoveMainImage(false);
    setVariants(
      (product.variants || []).map((v) => ({
        variant_group: v.variant_group || 'Option',
        variant_name: v.variant_name || '',
        price: v.price !== null && v.price !== undefined ? v.price : '',
        is_available: v.is_available !== false,
      }))
    );
    setGalleryFiles([]);
    setExistingGallery(product.images || []);
    setFormError('');
    setModalOpen(true);
  };

  const handleMainImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationErr = validateImageFileClient(file);
    if (validationErr) {
      setFormError(validationErr);
      return;
    }
    setFormError('');
    const processed = await prepareImageForUpload(file);
    setMainImageFile(processed);
    setRemoveMainImage(false);
    setMainImagePreview(URL.createObjectURL(processed));
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
    setRemoveMainImage(true);
  };

  const handleGallerySelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const err = validateImageFileClient(f);
      if (err) {
        setFormError(err);
        return;
      }
    }
    setFormError('');
    const processedList = await Promise.all(files.map((f) => prepareImageForUpload(f)));
    setGalleryFiles((prev) => [...prev, ...processedList]);
  };

  const handleDeleteExistingGalleryImage = async (imgId) => {
    try {
      await adminApi.deleteProductImage(imgId);
      setExistingGallery((prev) => prev.filter((item) => item.id !== imgId));
      setFeedback({ type: 'success', message: 'Removed gallery photo.' });
    } catch (err) {
      setFormError(err.message || 'Could not remove gallery photo.');
    }
  };

  const addVariantRow = (defaultGroup = 'Size') => {
    setVariants((prev) => [
      ...prev,
      { variant_group: defaultGroup, variant_name: '', price: '', is_available: true },
    ]);
  };

  const updateVariantRow = (idx, field, value) => {
    setVariants((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeVariantRow = (idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!form.category) {
      setFormError('Please select a menu category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: form.price === '' ? null : form.price,
        price_note: form.price_note.trim(),
        description: form.description.trim(),
        display_order: Number(form.display_order) || 0,
        is_published: form.is_published,
        is_featured: form.is_featured,
        is_best_seller: form.is_best_seller,
        mark_sold_out_today: Boolean(form.is_sold_out_today),
        is_archived: form.is_archived,
        variants_payload: JSON.stringify(variants),
      };

      if (mainImageFile) {
        payload.main_image = mainImageFile;
      } else if (removeMainImage) {
        payload.remove_main_image = true;
      }

      let savedProduct;
      if (editingProduct) {
        savedProduct = await adminApi.updateProduct(editingProduct.id, toFormData(payload));
      } else {
        savedProduct = await adminApi.createProduct(toFormData(payload));
      }

      // Upload any newly selected gallery images
      if (galleryFiles.length > 0 && savedProduct?.id) {
        for (const file of galleryFiles) {
          const imgForm = toFormData({
            image: file,
            alt_text: savedProduct.name,
          });
          await adminApi.uploadProductImage(savedProduct.id, imgForm);
        }
      }

      setModalOpen(false);
      setFeedback({
        type: 'success',
        message: editingProduct
          ? `Updated "${savedProduct.name}" and published to the menu!`
          : `Added "${savedProduct.name}" to the menu!`,
      });
      await loadData(showArchived);
    } catch (err) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-click toggles for Featured, Best Seller, Published, Archive
  const handleQuickToggle = async (product, field) => {
    const newValue = !product[field];
    try {
      const updated = await adminApi.updateProduct(
        product.id,
        toFormData({ [field]: newValue })
      );
      if (field === 'is_archived') {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setFeedback({
          type: 'success',
          message: newValue
            ? `Archived "${product.name}".`
            : `Restored "${product.name}" to active products.`,
        });
      } else {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Toggle failed.' });
    }
  };

  // Quick 1-tap toggle for 1-Day Sold Out ("Sold Out Today — Resets Tomorrow")
  const handleToggleSoldOutToday = async (product) => {
    const nextSoldOut = !product.is_sold_out_today;
    try {
      const updated = await adminApi.updateProduct(
        product.id,
        toFormData({ mark_sold_out_today: nextSoldOut })
      );
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      setFeedback({
        type: 'success',
        message: nextSoldOut
          ? `"${product.name}" is now marked SOLD OUT TODAY. It will automatically become Available again tomorrow!`
          : `"${product.name}" is now Available again on today's menu!`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update daily availability.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setFeedback({
        type: 'success',
        message: `Permanently deleted "${deleteTarget.name}".`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Delete failed.' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && String(p.category) !== String(categoryFilter)) {
        return false;
      }
      if (badgeFilter === 'featured' && !p.is_featured) return false;
      if (badgeFilter === 'best_seller' && !p.is_best_seller) return false;
      if (badgeFilter === 'sold_out_today' && !p.is_sold_out_today) return false;
      if (badgeFilter === 'hidden' && p.is_published) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.category_name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, badgeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/35 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Owner Menu &amp; Product Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Add or edit menu items, upload or replace product photographs, configure variations, and curate Featured or Best Seller items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              showArchived
                ? 'bg-[#F28A32] text-[#101C28] border-[#F28A32]'
                : 'bg-[#101C28] text-gray-300 border-white/15 hover:border-white/30'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? 'Viewing Archived' : 'Archived Items'}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
            feedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-2xl bg-[#171B20] border border-white/10 p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#F6C928]"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#F6C928]"
          >
            <option value="all">All Menu Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'sold_out_today', label: 'Sold Out Today' },
            { id: 'featured', label: 'Featured' },
            { id: 'best_seller', label: 'Best Seller' },
            { id: 'hidden', label: 'Hidden' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBadgeFilter(b.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                badgeFilter === b.id
                  ? 'bg-[#F6C928] text-[#101C28]'
                  : 'bg-[#101C28] text-gray-300 border border-white/10'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-12 text-center space-y-3">
          <p className="font-display font-bold text-lg text-white">
            No products found matching your filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setBadgeFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`rounded-2xl bg-[#171B20] border overflow-hidden flex flex-col justify-between transition-all ${
                product.is_published
                  ? 'border-white/10 hover:border-[#F6C928]/50'
                  : 'border-red-500/30 opacity-75'
              }`}
            >
              <div>
                {/* Image Header with Quick Upload/Edit Click */}
                <div className="relative aspect-[16/10] bg-[#101C28] overflow-hidden group">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ProductPlaceholder product={product} />
                  )}

                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#101C28]/90 text-[#FFF1C6] border border-white/15">
                      {product.category_name}
                    </span>
                    {product.is_sold_out_today && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-600 text-white border border-red-400 shadow-lg">
                        Sold Out Today (1-Day)
                      </span>
                    )}
                    {!product.main_image_url && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#101C28]/90 text-gray-400 border border-white/10">
                        Placeholder
                      </span>
                    )}
                  </div>

                  {/* Quick Edit Photo Button Overlay */}
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#101C28]/90 hover:bg-[#F6C928] text-white hover:text-[#101C28] border border-white/20 transition-colors cursor-pointer shadow-lg"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{product.main_image_url ? 'Replace Photo' : 'Upload Photo'}</span>
                  </button>
                </div>

                {/* Product Summary */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                      {product.name}
                    </h3>
                    <span className="font-display font-extrabold text-base text-[#F6C928] whitespace-nowrap">
                      {formatProductPrice(product)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {product.description || 'No description set.'}
                  </p>
                  {product.variants?.length > 0 && (
                    <p className="text-[11px] text-[#23C7DF] font-semibold">
                      {product.variants.length} configured variations
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Toggle Bar & Edit/Delete Actions */}
              <div className="p-4 pt-3 border-t border-white/10 space-y-3 bg-[#101C28]/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickToggle(product, 'is_published')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      product.is_published
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    {product.is_published ? (
                      <>
                        <Eye className="w-3 h-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Hidden
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickToggle(product, 'is_featured')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      product.is_featured
                        ? 'bg-[#F6C928] text-[#101C28] border-[#F6C928]'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickToggle(product, 'is_best_seller')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      product.is_best_seller
                        ? 'bg-[#F28A32] text-[#101C28] border-[#F28A32]'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    Best Seller
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSoldOutToday(product)}
                    title="Marks this dish Sold Out for today only. Automatically resets to Available tomorrow."
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      product.is_sold_out_today
                        ? 'bg-red-500 text-white border-red-400 shadow-sm'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-red-400/50 hover:text-red-300'
                    }`}
                  >
                    {product.is_sold_out_today ? (
                      <>
                        <Clock className="w-3 h-3" /> Sold Out Today (Tap to Restore)
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3" /> Mark Sold Out Today
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#F6C928]/15 hover:bg-[#F6C928] text-[#F6C928] hover:text-[#101C28] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details &amp; Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickToggle(product, 'is_archived')}
                    title={product.is_archived ? 'Restore Product' : 'Archive Product'}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                  >
                    {product.is_archived ? (
                      <RotateCcw className="w-4 h-4 text-[#23C7DF]" />
                    ) : (
                      <Archive className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    title="Permanently Delete Product"
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL (Phone & Desktop Responsive) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#171B20] border-t sm:border border-[#F6C928]/40 p-4 sm:p-8 shadow-2xl text-white">
            <div className="sticky top-0 z-10 bg-[#171B20] flex items-center justify-between pb-3.5 border-b border-white/10">
              <div>
                <h2 className="font-display font-black text-lg sm:text-2xl text-white">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Menu Product'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure details, take or upload photos from your phone, and set variations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-[#101C28] text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Image Upload Interface */}
                <div className="md:col-span-5 space-y-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#F6C928]">
                    Main Product Photograph
                  </label>

                  <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#101C28] border border-white/15 flex items-center justify-center">
                    {mainImagePreview ? (
                      <img
                        src={mainImagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ProductPlaceholder
                        product={{
                          name: form.name || 'Product Preview',
                          category_name:
                            categories.find((c) => String(c.id) === String(form.category))
                              ?.name || 'Kamalig Menu',
                        }}
                      />
                    )}
                  </div>

                  {/* Upload / Replace / Remove Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{mainImagePreview ? 'Replace Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="hidden"
                      />
                    </label>

                    {mainImagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveMainImage}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Image</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Supports all phone camera and gallery photos (OPPO, Android, iPhone). Large photos are automatically compressed for fast upload.
                  </p>

                  {/* Additional Gallery Images */}
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                        Additional Gallery Photos
                      </span>
                      <label className="inline-flex items-center gap-1 text-xs font-bold text-[#23C7DF] hover:underline cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>+ Add Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGallerySelect}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {(existingGallery.length > 0 || galleryFiles.length > 0) && (
                      <div className="grid grid-cols-4 gap-2">
                        {existingGallery.map((img) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-xl overflow-hidden border border-white/15 group"
                          >
                            <img
                              src={img.image_url}
                              alt="Gallery"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingGalleryImage(img.id)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-red-400 hover:text-red-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {galleryFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden border border-[#23C7DF]"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt="New upload"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Product Information */}
                <div className="md:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., Pork Sisigilog"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                        Base Price (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="Leave blank if by size"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                        Price Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.price_note}
                        onChange={(e) => setForm({ ...form, price_note: e.target.value })}
                        placeholder="e.g., 12oz ₱27 • 16oz ₱35"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={form.display_order}
                        onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the dish, ingredients, or serving style..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
                    />
                  </div>

                  {/* Status & Highlight Checkboxes */}
                  <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_published}
                        onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                        className="w-4 h-4 accent-[#F6C928]"
                      />
                      <span>Published on Menu</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-bold text-red-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_sold_out_today}
                        onChange={(e) => setForm({ ...form, is_sold_out_today: e.target.checked })}
                        className="w-4 h-4 accent-red-500"
                      />
                      <span>Sold Out Today (Resets Tomorrow)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-bold text-[#F6C928] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="w-4 h-4 accent-[#F6C928]"
                      />
                      <span>Mark as Featured</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-bold text-[#F28A32] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_best_seller}
                        onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })}
                        className="w-4 h-4 accent-[#F28A32]"
                      />
                      <span>Mark as Best Seller</span>
                    </label>
                  </div>

                  {/* Product Variations (Sizes, Flavors, Toppings) */}
                  <div className="pt-2 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[#23C7DF]">
                        Product Variations (Sizes, Flavors, Toppings)
                      </label>
                      <div className="flex gap-1.5">
                        {['Size', 'Flavor', 'Topping'].map((groupType) => (
                          <button
                            key={groupType}
                            type="button"
                            onClick={() => addVariantRow(groupType)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#101C28] hover:bg-white/10 text-[#FFF1C6] border border-white/15 cursor-pointer"
                          >
                            + Add {groupType}
                          </button>
                        ))}
                      </div>
                    </div>

                    {variants.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No variations configured. Use the buttons above to add sizes (e.g., 12 oz, 16 oz, 22 oz), flavors, or toppings.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {variants.map((v, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 items-center bg-[#101C28] p-2.5 rounded-xl border border-white/10"
                          >
                            <div className="col-span-5 sm:col-span-3">
                              <select
                                value={v.variant_group}
                                onChange={(e) =>
                                  updateVariantRow(idx, 'variant_group', e.target.value)
                                }
                                className="w-full px-2 py-2 rounded-lg bg-[#171B20] border border-white/10 text-xs text-white"
                              >
                                <option value="Size">Size</option>
                                <option value="Flavor">Flavor</option>
                                <option value="Topping">Topping</option>
                                <option value="Option">Option</option>
                              </select>
                            </div>
                            <div className="col-span-7 sm:col-span-5">
                              <input
                                type="text"
                                value={v.variant_name}
                                onChange={(e) =>
                                  updateVariantRow(idx, 'variant_name', e.target.value)
                                }
                                placeholder="e.g., 16 oz or Strawberry"
                                className="w-full px-2.5 py-2 rounded-lg bg-[#171B20] border border-white/10 text-xs text-white"
                              />
                            </div>
                            <div className="col-span-10 sm:col-span-3">
                              <input
                                type="number"
                                step="0.01"
                                value={v.price}
                                onChange={(e) =>
                                  updateVariantRow(idx, 'price', e.target.value)
                                }
                                placeholder="Price (₱) Optional"
                                className="w-full px-2.5 py-2 rounded-lg bg-[#171B20] border border-white/10 text-xs text-white"
                              />
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? 'Saving & Publishing...'
                    : editingProduct
                    ? 'Save & Publish Product'
                    : 'Create & Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#171B20] border border-red-500/40 p-6 sm:p-8 shadow-2xl text-white space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-white">
                Delete &ldquo;{deleteTarget.name}&rdquo;?
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                This will permanently remove this product and its variations from the database. If you only want to hide it temporarily, you can unpublish or archive it instead.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-red-500 hover:bg-red-600 text-white cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

