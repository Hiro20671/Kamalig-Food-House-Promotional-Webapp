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
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    name: '',
    description: '',
    display_order: 1,
    is_published: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load categories.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingCat(null);
    setForm({
      name: '',
      description: '',
      display_order: categories.length + 1,
      is_published: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      display_order: cat.display_order ?? 1,
      is_published: cat.is_published !== false,
    });
    setImageFile(null);
    setImagePreview(cat.image_url || null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payloadData = {
        name: form.name.trim(),
        description: form.description.trim(),
        display_order: Number(form.display_order) || 0,
        is_published: form.is_published,
      };
      if (imageFile) payloadData.image = imageFile;
      if (removeImage) payloadData.remove_image = true;

      const payload = toFormData(payloadData);

      if (editingCat) {
        await adminApi.updateCategory(editingCat.id, payload);
        setFeedback({ type: 'success', message: `Updated category "${form.name}".` });
      } else {
        await adminApi.createCategory(payload);
        setFeedback({ type: 'success', message: `Created category "${form.name}".` });
      }
      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save category.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (cat) => {
    try {
      await adminApi.updateCategory(
        cat.id,
        toFormData({ is_published: !cat.is_published })
      );
      await loadCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      setFeedback({ type: 'success', message: `Deleted category "${deleteTarget.name}".` });
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/35 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Menu Categories Management (CRUD)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Create, edit, upload category images, reorder, publish/hide, or delete menu categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl bg-[#171B20] border border-white/10 p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#F6C928]/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center font-display font-black text-sm flex-shrink-0">
                      #{cat.display_order}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#101C28] text-[#23C7DF] border border-white/10 whitespace-nowrap">
                  {cat.product_count} items
                </span>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    cat.is_published
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }`}
                >
                  {cat.is_published ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hidden
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-[#F6C928] text-white hover:text-[#101C28] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#171B20] border-t sm:border border-[#F6C928]/40 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-display font-black text-xl text-white">
                {editingCat ? `Edit Category: ${editingCat.name}` : 'Add Menu Category'}
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Rice Meals"
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
                  placeholder="Short description shown under the category heading..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>

              {/* Category Image Upload / Replace / Remove */}
              <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Category Image (Optional)
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Category Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-white/15"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28] cursor-pointer">
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

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
                <label className="flex items-center gap-2.5 text-xs font-bold text-white pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4 accent-[#F6C928]"
                  />
                  <span>Published on Website</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#171B20] border border-red-500/40 p-6 space-y-4 text-white">
            <h3 className="font-display font-black text-xl">
              Delete Category &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Deleting a category will also remove the {deleteTarget.product_count} products assigned to it.
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
