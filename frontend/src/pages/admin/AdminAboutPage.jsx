import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';
import CmsWorkflowBar from '../../components/admin/CmsWorkflowBar';

export default function AdminAboutPage() {
  const [serverData, setServerData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Gallery upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const populateState = (data) => {
    setServerData(data);
    setForm({ ...data, ...(data.draft_data || {}) });
    setHasUnsavedEdits(false);
  };

  useEffect(() => {
    adminApi
      .getAbout()
      .then(populateState)
      .catch((err) => setFeedback({ type: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedEdits(true);
  };

  const updateWhyVisitItem = (idx, field, value) => {
    const items = [...(form.why_visit_items || [])];
    items[idx] = { ...items[idx], [field]: value };
    updateField('why_visit_items', items);
  };

  const addWhyVisitItem = () => {
    updateField('why_visit_items', [
      ...(form.why_visit_items || []),
      { title: 'New Reason to Visit', description: 'Add details here.' },
    ]);
  };

  const removeWhyVisitItem = (idx) => {
    updateField(
      'why_visit_items',
      (form.why_visit_items || []).filter((_, i) => i !== idx)
    );
  };

  const handleUploadStorePhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('image', photoFile);
      fd.append('caption', photoCaption.trim());
      fd.append('alt_text', photoCaption.trim() || 'Kamalig Food House');
      const createdImg = await adminApi.uploadAboutImage(fd);
      setServerData((prev) => ({
        ...prev,
        images: [...(prev?.images || []), createdImg],
      }));
      setPhotoFile(null);
      setPhotoCaption('');
      setFeedback({ type: 'success', message: 'Uploaded business photograph to About Us gallery!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Upload failed.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteStorePhoto = async (imgId) => {
    try {
      await adminApi.deleteAboutImage(imgId);
      setServerData((prev) => ({
        ...prev,
        images: (prev?.images || []).filter((i) => i.id !== imgId),
      }));
      setFeedback({ type: 'success', message: 'Removed photograph from About Us gallery.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const submitWorkflow = async (workflowAction) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      if (workflowAction === 'discard_draft') {
        const res = await adminApi.updateAbout(
          toFormData({ workflow_action: 'discard_draft' })
        );
        populateState(res);
        setFeedback({ type: 'success', message: 'Reverted to published About Us content.' });
        return;
      }

      const payload = {
        workflow_action: workflowAction,
        title: form.title,
        subtitle: form.subtitle,
        introduction: form.introduction,
        story_heading: form.story_heading,
        business_story: form.business_story,
        show_story: form.show_story,
        mission_heading: form.mission_heading,
        mission: form.mission,
        show_mission: form.show_mission,
        vision_heading: form.vision_heading,
        vision: form.vision,
        show_vision: form.show_vision,
        brand_identity_heading: form.brand_identity_heading,
        brand_identity_text: form.brand_identity_text,
        show_brand_identity: form.show_brand_identity,
        why_visit_heading: form.why_visit_heading,
        why_visit_items: form.why_visit_items,
        show_why_visit: form.show_why_visit,
        gallery_heading: form.gallery_heading,
        show_gallery: form.show_gallery,
      };

      const updated = await adminApi.updateAbout(toFormData(payload));
      populateState(updated);
      setFeedback({
        type: 'success',
        message:
          workflowAction === 'save_draft'
            ? 'About Us draft saved!'
            : 'About Us content published live to the website!',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save About Us.' });
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
        title="About Us Page Editor"
        subtitle="Manage your business introduction, story, mission, vision, brand identity, and store photographs. Sections without content remain safely hidden."
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
        <div className="rounded-3xl bg-[#101C28] border-2 border-[#23C7DF] p-6 sm:p-10 space-y-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#23C7DF]">
            Live About Us Preview
          </span>
          <h2 className="font-display font-black text-3xl text-white">{form.title}</h2>
          <p className="text-gray-300 text-sm sm:text-base">{form.introduction}</p>
          {form.show_story && form.business_story && (
            <div className="p-4 rounded-2xl bg-[#171B20] border border-white/10">
              <h3 className="font-bold text-[#F6C928] mb-1">{form.story_heading}</h3>
              <p className="text-xs text-gray-300 whitespace-pre-line">{form.business_story}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.show_mission && form.mission && (
              <div className="p-4 rounded-2xl bg-[#171B20] border border-white/10">
                <h3 className="font-bold text-[#F6C928] mb-1">{form.mission_heading}</h3>
                <p className="text-xs text-gray-300">{form.mission}</p>
              </div>
            )}
            {form.show_vision && form.vision && (
              <div className="p-4 rounded-2xl bg-[#171B20] border border-white/10">
                <h3 className="font-bold text-[#23C7DF] mb-1">{form.vision_heading}</h3>
                <p className="text-xs text-gray-300">{form.vision}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Introduction */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-xl text-[#F6C928]">
          1. Page Title &amp; Business Introduction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              About Us Title
            </label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={form.subtitle || ''}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Business Introduction
          </label>
          <textarea
            rows={3}
            value={form.introduction || ''}
            onChange={(e) => updateField('introduction', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
      </div>

      {/* Business Story, Mission, Vision */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F6C928]">
              2. Business Story, Mission &amp; Vision
            </h2>
            <p className="text-xs text-gray-400">
              Enable each section when you are ready to display it publicly.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={form.story_heading || 'Our Story'}
              onChange={(e) => updateField('story_heading', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#171B20] border border-white/10 text-xs font-bold text-[#F6C928]"
            />
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.show_story)}
                onChange={(e) => updateField('show_story', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Show Story on Public Page</span>
            </label>
          </div>
          <textarea
            rows={4}
            value={form.business_story || ''}
            onChange={(e) => updateField('business_story', e.target.value)}
            placeholder="Write the authentic story of Kamalig Food House..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
          />
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={form.mission_heading || 'Our Mission'}
                onChange={(e) => updateField('mission_heading', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#171B20] border border-white/10 text-xs font-bold text-[#F6C928]"
              />
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.show_mission)}
                  onChange={(e) => updateField('show_mission', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                <span>Show Mission</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={form.mission || ''}
              onChange={(e) => updateField('mission', e.target.value)}
              placeholder="Enter Kamalig Food House's mission..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={form.vision_heading || 'Our Vision'}
                onChange={(e) => updateField('vision_heading', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#171B20] border border-white/10 text-xs font-bold text-[#23C7DF]"
              />
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.show_vision)}
                  onChange={(e) => updateField('show_vision', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                <span>Show Vision</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={form.vision || ''}
              onChange={(e) => updateField('vision', e.target.value)}
              placeholder="Enter Kamalig Food House's vision..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Why Visit Kamalig */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-[#F6C928]">
            3. Why Customers Should Visit Kamalig
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_why_visit !== false}
                onChange={(e) => updateField('show_why_visit', e.target.checked)}
                className="accent-[#F6C928]"
              />
              <span>Visible</span>
            </label>
            <button
              type="button"
              onClick={addWhyVisitItem}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28]"
            >
              + Add Reason
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(form.why_visit_items || []).map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#F6C928]">Reason #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeWhyVisitItem(idx)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => updateWhyVisitItem(idx, 'title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs font-bold text-white"
              />
              <textarea
                rows={3}
                value={item.description || ''}
                onChange={(e) => updateWhyVisitItem(idx, 'description', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Store Photographs Gallery Uploader */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-[#23C7DF]">
              4. Food House Photographs Gallery
            </h2>
            <p className="text-xs text-gray-400">
              Upload multiple photographs of Kamalig Food House, dining area, or team.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_gallery !== false}
              onChange={(e) => updateField('show_gallery', e.target.checked)}
              className="accent-[#F6C928]"
            />
            <span>Show Gallery</span>
          </label>
        </div>

        <form
          onSubmit={handleUploadStorePhoto}
          className="p-4 rounded-2xl bg-[#101C28] border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white cursor-pointer">
            <ImageIcon className="w-4 h-4 text-[#F6C928]" />
            <span>{photoFile ? photoFile.name : 'Choose Photo...'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
            placeholder="Optional photo caption..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
          />
          <button
            type="submit"
            disabled={!photoFile || uploadingPhoto}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] text-[#101C28] disabled:opacity-40 cursor-pointer"
          >
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </button>
        </form>

        {(serverData?.images || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {serverData.images.map((img) => (
              <div
                key={img.id}
                className="relative rounded-2xl overflow-hidden bg-[#101C28] border border-white/10 p-2.5 space-y-2 group"
              >
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={img.image_url}
                    alt={img.caption || 'Store Photo'}
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteStorePhoto(img.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-red-400 hover:text-red-300 cursor-pointer"
                    title="Delete Photograph"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    defaultValue={img.caption || ''}
                    placeholder="Photo caption..."
                    onBlur={async (e) => {
                      const newCap = e.target.value.trim();
                      if (newCap !== (img.caption || '')) {
                        try {
                          const updatedImg = await adminApi.updateAboutImage(img.id, {
                            caption: newCap,
                            alt_text: newCap || 'Kamalig Food House',
                          });
                          setServerData((prev) => ({
                            ...prev,
                            images: (prev?.images || []).map((i) =>
                              i.id === img.id ? updatedImg : i
                            ),
                          }));
                          setFeedback({ type: 'success', message: 'Updated photo caption!' });
                        } catch (err) {
                          setFeedback({ type: 'error', message: err.message });
                        }
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#171B20] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

