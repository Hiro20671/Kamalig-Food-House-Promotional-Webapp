import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    badge_text: 'KAMALIG SPECIAL',
    button_label: 'Explore Our Menu',
    button_destination: '/menu',
    display_order: 1,
    is_published: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPromotions();
      setPromotions(data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const openAdd = () => {
    setEditingPromo(null);
    setForm({
      title: 'Craving Something Delicious?',
      subtitle: 'Good Food, Great Mood! • Sarap na Abot-Kaya!',
      description: 'Discover your next favorite meal at Kamalig Food House!',
      badge_text: 'SPECIAL PROMO',
      button_label: 'Explore Our Menu',
      button_destination: '/menu',
      display_order: promotions.length + 1,
      is_published: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const openEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      title: promo.title || '',
      subtitle: promo.subtitle || '',
      description: promo.description || '',
      badge_text: promo.badge_text || '',
      button_label: promo.button_label || '',
      button_destination: promo.button_destination || '/menu',
      display_order: promo.display_order ?? 1,
      is_published: promo.is_published !== false,
    });
    setImageFile(null);
    setImagePreview(promo.image_url || null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        display_order: Number(form.display_order) || 1,
      };
      if (imageFile) payload.image = imageFile;
      if (removeImage) payload.remove_image = true;

      if (editingPromo) {
        await adminApi.updatePromotion(editingPromo.id, toFormData(payload));
        setFeedback({ type: 'success', message: `Updated promotional banner "${form.title}".` });
      } else {
        await adminApi.createPromotion(toFormData(payload));
        setFeedback({ type: 'success', message: `Created promotional banner "${form.title}".` });
      }
      setModalOpen(false);
      await loadPromos();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (promo) => {
    try {
      await adminApi.updatePromotion(
        promo.id,
        toFormData({ is_published: !promo.is_published })
      );
      await loadPromos();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deletePromotion(deleteTarget.id);
      setFeedback({ type: 'success', message: `Deleted banner "${deleteTarget.title}".` });
      setDeleteTarget(null);
      await loadPromos();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/35 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Promotional Banners Manager
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Create and customize promotional banners displayed on the public Homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Promo Banner</span>
        </button>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${
            feedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="rounded-3xl bg-[#171B20] border border-white/10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center gap-2">
                  {promo.badge_text && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F6C928] text-[#101C28]">
                      {promo.badge_text}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Order #{promo.display_order}</span>
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  {promo.title}
                </h3>
                {promo.subtitle && (
                  <p className="text-sm font-bold text-[#F6C928]">{promo.subtitle}</p>
                )}
                <p className="text-xs sm:text-sm text-gray-300">{promo.description}</p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(promo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      promo.is_published
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    {promo.is_published ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(promo)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-[#F6C928] text-white hover:text-[#101C28] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(promo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                {promo.image_url ? (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-44 object-cover rounded-2xl border border-white/10"
                  />
                ) : (
                  <div className="h-44 rounded-2xl bg-[#101C28] border border-white/10 flex flex-col items-center justify-center text-center p-4">
                    <Sparkles className="w-8 h-8 text-[#F6C928] mb-2" />
                    <span className="text-xs text-gray-400">No banner photo uploaded</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#171B20] border border-[#F6C928]/40 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-display font-black text-xl text-white">
                {editingPromo ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={form.badge_text}
                    onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={form.button_label}
                    onChange={(e) => setForm({ ...form, button_label: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Button Destination Link
                  </label>
                  <input
                    type="text"
                    value={form.button_destination}
                    onChange={(e) => setForm({ ...form, button_destination: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Banner Image (Optional)
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Promo Preview"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                )}
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imagePreview ? 'Replace Image' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setImageFile(f);
                          setImagePreview(URL.createObjectURL(f));
                          setRemoveImage(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setRemoveImage(true);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/15 text-red-300"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4 accent-[#F6C928]"
                  />
                  <span>Published on Homepage</span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] text-[#101C28]"
                  >
                    {saving ? 'Saving...' : 'Save & Publish Banner'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#171B20] border border-red-500/40 p-6 space-y-4 text-white">
            <h3 className="font-display font-black text-xl">
              Delete Banner &ldquo;{deleteTarget.title}&rdquo;?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This will permanently remove this promotional banner from the homepage.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-red-500 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

