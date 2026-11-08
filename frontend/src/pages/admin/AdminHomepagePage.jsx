import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';
import CmsWorkflowBar from '../../components/admin/CmsWorkflowBar';

export default function AdminHomepagePage() {
  const [serverData, setServerData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Hero Image Uploads
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const [removeBg, setRemoveBg] = useState(false);

  const [featFile, setFeatFile] = useState(null);
  const [featPreview, setFeatPreview] = useState(null);
  const [removeFeat, setRemoveFeat] = useState(false);

  const populateState = (data) => {
    setServerData(data);
    // Merge draft_data over published fields so the owner can continue editing their draft
    const merged = { ...data, ...(data.draft_data || {}) };
    setForm(merged);
    setBgFile(null);
    setBgPreview(data.hero_background_image_url || null);
    setRemoveBg(false);
    setFeatFile(null);
    setFeatPreview(data.hero_featured_image_url || null);
    setRemoveFeat(false);
    setHasUnsavedEdits(false);
  };

  useEffect(() => {
    adminApi
      .getHomepage()
      .then(populateState)
      .catch((err) => setFeedback({ type: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedEdits(true);
  };

  const updateWhyChooseItem = (index, field, value) => {
    const items = [...(form.why_choose_items || [])];
    items[index] = { ...items[index], [field]: value };
    updateField('why_choose_items', items);
  };

  const addWhyChooseItem = () => {
    const items = [
      ...(form.why_choose_items || []),
      {
        id: `item-${Date.now()}`,
        icon: 'Sparkles',
        title: 'New Highlight',
        description: 'Describe why customers love Kamalig Food House.',
        is_visible: true,
      },
    ];
    updateField('why_choose_items', items);
  };

  const removeWhyChooseItem = (index) => {
    const items = (form.why_choose_items || []).filter((_, i) => i !== index);
    updateField('why_choose_items', items);
  };

  const moveSectionOrder = (index, direction) => {
    const order = [...(form.section_order || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;
    updateField('section_order', order);
  };

  const submitWorkflow = async (workflowAction) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      if (workflowAction === 'discard_draft') {
        const res = await adminApi.updateHomepage(
          toFormData({ workflow_action: 'discard_draft' })
        );
        populateState(res);
        setFeedback({ type: 'success', message: 'Reverted to published homepage content.' });
        return;
      }

      const payload = {
        workflow_action: workflowAction,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        hero_description: form.hero_description,
        primary_button_label: form.primary_button_label,
        primary_button_destination: form.primary_button_destination,
        secondary_button_label: form.secondary_button_label,
        secondary_button_destination: form.secondary_button_destination,
        show_hero: form.show_hero,
        show_hero_subtitle: form.show_hero_subtitle,
        show_hero_description: form.show_hero_description,
        show_primary_button: form.show_primary_button,
        show_secondary_button: form.show_secondary_button,
        show_featured_section: form.show_featured_section,
        featured_section_title: form.featured_section_title,
        featured_section_subtitle: form.featured_section_subtitle,
        show_best_sellers_section: form.show_best_sellers_section,
        best_sellers_title: form.best_sellers_title,
        best_sellers_subtitle: form.best_sellers_subtitle,
        show_promo_section: form.show_promo_section,
        show_why_choose_section: form.show_why_choose_section,
        why_choose_title: form.why_choose_title,
        why_choose_subtitle: form.why_choose_subtitle,
        why_choose_items: form.why_choose_items,
        show_about_preview: form.show_about_preview,
        about_preview_title: form.about_preview_title,
        about_preview_description: form.about_preview_description,
        about_preview_button_label: form.about_preview_button_label,
        show_location_preview: form.show_location_preview,
        location_preview_title: form.location_preview_title,
        location_preview_subtitle: form.location_preview_subtitle,
        location_preview_button_label: form.location_preview_button_label,
        section_order: form.section_order,
      };

      if (bgFile) payload.hero_background_image = bgFile;
      if (removeBg) payload.remove_hero_background_image = true;
      if (featFile) payload.hero_featured_image = featFile;
      if (removeFeat) payload.remove_hero_featured_image = true;

      const updated = await adminApi.updateHomepage(toFormData(payload));
      populateState(updated);
      setFeedback({
        type: 'success',
        message:
          workflowAction === 'save_draft'
            ? 'Homepage draft saved! Click "Publish to Website" when ready to go live.'
            : 'Homepage published live to the public website!',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save homepage.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <CmsWorkflowBar
        title="Home Page Content Editor"
        subtitle="Manage the Hero banner, Featured & Best Seller headings, Why Choose Kamalig, previews, visibility, and section order."
        hasUnsavedEdits={hasUnsavedEdits}
        hasServerDraft={serverData?.has_unpublished_changes}
        lastPublishedAt={serverData?.last_published_at}
        saving={saving}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((p) => !p)}
        onSaveDraft={() => submitWorkflow('save_draft')}
        onPublish={() => submitWorkflow('publish')}
        onDiscard={() => submitWorkflow('discard_draft')}
      />

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

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="rounded-3xl bg-[#101C28] border-2 border-[#23C7DF] p-6 sm:p-10 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#23C7DF]">
              Live Hero &amp; Homepage Preview
            </span>
            <span className="text-xs text-gray-400">
              Reflects your current form edits in real time
            </span>
          </div>
          {form.show_hero !== false && (
            <div className="space-y-4">
              {form.show_hero_subtitle !== false && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6C928]/15 text-[#F6C928] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  {form.hero_subtitle}
                </span>
              )}
              <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
                {form.hero_title}
              </h2>
              {form.show_hero_description !== false && (
                <p className="text-gray-300 text-sm sm:text-base max-w-2xl">
                  {form.hero_description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
                {form.show_primary_button !== false && (
                  <span className="px-5 py-2.5 rounded-xl bg-[#F6C928] text-[#101C28] font-bold text-xs">
                    {form.primary_button_label} ({form.primary_button_destination})
                  </span>
                )}
                {form.show_secondary_button !== false && (
                  <span className="px-5 py-2.5 rounded-xl bg-[#171B20] border border-white/20 text-white font-bold text-xs">
                    {form.secondary_button_label} ({form.secondary_button_destination})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Hero Section Editor */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F6C928]">
              1. Hero Section
            </h2>
            <p className="text-xs text-gray-400">
              Main headline, supporting tagline, introductory description, buttons, and images.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_hero !== false}
              onChange={(e) => updateField('show_hero', e.target.checked)}
              className="w-4 h-4 accent-[#F6C928]"
            />
            <span>Show Hero Section</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Main Headline (Hero Title)
            </label>
            <input
              type="text"
              value={form.hero_title || ''}
              onChange={(e) => updateField('hero_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Supporting Headline (Subtitle)
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_hero_subtitle !== false}
                  onChange={(e) => updateField('show_hero_subtitle', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Visible
              </label>
            </div>
            <input
              type="text"
              value={form.hero_subtitle || ''}
              onChange={(e) => updateField('hero_subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Short Introductory Description
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_hero_description !== false}
                onChange={(e) => updateField('show_hero_description', e.target.checked)}
                className="accent-[#F6C928]"
              />
              Visible
            </label>
          </div>
          <textarea
            rows={3}
            value={form.hero_description || ''}
            onChange={(e) => updateField('hero_description', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>

        {/* Hero Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F6C928]">Primary CTA Button</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_primary_button !== false}
                  onChange={(e) => updateField('show_primary_button', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Show Button
              </label>
            </div>
            <input
              type="text"
              value={form.primary_button_label || ''}
              onChange={(e) => updateField('primary_button_label', e.target.value)}
              placeholder="Button Label (e.g., Explore Our Menu)"
              className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
            <input
              type="text"
              value={form.primary_button_destination || ''}
              onChange={(e) => updateField('primary_button_destination', e.target.value)}
              placeholder="Destination (e.g., /menu)"
              className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#23C7DF]">Secondary CTA Button</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_secondary_button !== false}
                  onChange={(e) => updateField('show_secondary_button', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Show Button
              </label>
            </div>
            <input
              type="text"
              value={form.secondary_button_label || ''}
              onChange={(e) => updateField('secondary_button_label', e.target.value)}
              placeholder="Button Label (e.g., Find Our Location)"
              className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
            <input
              type="text"
              value={form.secondary_button_destination || ''}
              onChange={(e) => updateField('secondary_button_destination', e.target.value)}
              placeholder="Destination (e.g., /location)"
              className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
          </div>
        </div>

        {/* Hero Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Featured Food Showcase Image
            </label>
            {featPreview && (
              <img
                src={featPreview}
                alt="Featured Hero"
                className="w-full h-40 object-cover rounded-xl border border-white/10"
              />
            )}
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{featPreview ? 'Replace Image' : 'Upload Featured Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFeatFile(f);
                      setFeatPreview(URL.createObjectURL(f));
                      setRemoveFeat(false);
                      setHasUnsavedEdits(true);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {featPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setFeatFile(null);
                    setFeatPreview(null);
                    setRemoveFeat(true);
                    setHasUnsavedEdits(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/15 text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Hero Background Photograph (Optional)
            </label>
            {bgPreview && (
              <img
                src={bgPreview}
                alt="Hero Background"
                className="w-full h-40 object-cover rounded-xl border border-white/10"
              />
            )}
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{bgPreview ? 'Replace Background' : 'Upload Background'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setBgFile(f);
                      setBgPreview(URL.createObjectURL(f));
                      setRemoveBg(false);
                      setHasUnsavedEdits(true);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {bgPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setBgFile(null);
                    setBgPreview(null);
                    setRemoveBg(true);
                    setHasUnsavedEdits(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/15 text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Featured & Best Sellers Section Headings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#F6C928]">
              2. Featured Products Section
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_featured_section !== false}
                onChange={(e) => updateField('show_featured_section', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Visible</span>
            </label>
          </div>
          <input
            type="text"
            value={form.featured_section_title || ''}
            onChange={(e) => updateField('featured_section_title', e.target.value)}
            placeholder="Section Title"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
          <input
            type="text"
            value={form.featured_section_subtitle || ''}
            onChange={(e) => updateField('featured_section_subtitle', e.target.value)}
            placeholder="Section Subtitle"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>

        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#F28A32]">
              3. Best Sellers Section
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_best_sellers_section !== false}
                onChange={(e) => updateField('show_best_sellers_section', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Visible</span>
            </label>
          </div>
          <input
            type="text"
            value={form.best_sellers_title || ''}
            onChange={(e) => updateField('best_sellers_title', e.target.value)}
            placeholder="Best Sellers Section Title"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
          <input
            type="text"
            value={form.best_sellers_subtitle || ''}
            onChange={(e) => updateField('best_sellers_subtitle', e.target.value)}
            placeholder="Best Sellers Subtitle"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
      </div>

      {/* 4. Why Choose Kamalig Section */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F6C928]">
              4. &ldquo;Why Choose Kamalig?&rdquo; Section
            </h2>
            <p className="text-xs text-gray-400">
              Edit the titles, descriptions, icons, and visibility of each highlight card.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_why_choose_section !== false}
                onChange={(e) => updateField('show_why_choose_section', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Show Section</span>
            </label>
            <button
              type="button"
              onClick={addWhyChooseItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={form.why_choose_title || ''}
            onChange={(e) => updateField('why_choose_title', e.target.value)}
            placeholder="Section Heading"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
          <input
            type="text"
            value={form.why_choose_subtitle || ''}
            onChange={(e) => updateField('why_choose_subtitle', e.target.value)}
            placeholder="Section Subtitle"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(form.why_choose_items || []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <select
                  value={item.icon || 'Utensils'}
                  onChange={(e) => updateWhyChooseItem(idx, 'icon', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#171B20] border border-white/15 text-xs text-[#F6C928] font-bold"
                >
                  <option value="Utensils">Icon: Utensils</option>
                  <option value="CupSoda">Icon: CupSoda</option>
                  <option value="Sparkles">Icon: Sparkles</option>
                  <option value="Flame">Icon: Flame</option>
                  <option value="Coffee">Icon: Coffee</option>
                  <option value="Award">Icon: Award</option>
                  <option value="Heart">Icon: Heart</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_visible !== false}
                      onChange={(e) =>
                        updateWhyChooseItem(idx, 'is_visible', e.target.checked)
                      }
                      className="accent-[#F6C928]"
                    />
                    Show
                  </label>
                  <button
                    type="button"
                    onClick={() => removeWhyChooseItem(idx)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => updateWhyChooseItem(idx, 'title', e.target.value)}
                placeholder="Highlight Title"
                className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs font-bold text-white"
              />
              <textarea
                rows={3}
                value={item.description || ''}
                onChange={(e) => updateWhyChooseItem(idx, 'description', e.target.value)}
                placeholder="Highlight Description"
                className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-gray-200"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 5. About Preview & Location Preview & Section Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#23C7DF]">
              5. Homepage About Preview
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_about_preview !== false}
                onChange={(e) => updateField('show_about_preview', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Visible</span>
            </label>
          </div>
          <input
            type="text"
            value={form.about_preview_title || ''}
            onChange={(e) => updateField('about_preview_title', e.target.value)}
            placeholder="About Preview Title"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
          <textarea
            rows={3}
            value={form.about_preview_description || ''}
            onChange={(e) => updateField('about_preview_description', e.target.value)}
            placeholder="About Preview Text"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
          <input
            type="text"
            value={form.about_preview_button_label || ''}
            onChange={(e) => updateField('about_preview_button_label', e.target.value)}
            placeholder="Button Label"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>

        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#F6C928]">
              6. Homepage Section Display Order
            </h3>
            <span className="text-xs text-gray-400">Move up/down</span>
          </div>
          <div className="space-y-2">
            {(form.section_order || []).map((secKey, idx) => (
              <div
                key={secKey}
                className="px-4 py-2.5 rounded-xl bg-[#101C28] border border-white/10 flex items-center justify-between text-xs font-bold text-white"
              >
                <span className="uppercase tracking-wider">
                  {idx + 1}. {secKey.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSectionOrder(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSectionOrder(idx, 1)}
                    disabled={idx === (form.section_order || []).length - 1}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

