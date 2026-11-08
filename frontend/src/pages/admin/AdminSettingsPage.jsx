import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminApi, toFormData } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import CmsWorkflowBar from '../../components/admin/CmsWorkflowBar';

export default function AdminSettingsPage() {
  const [serverData, setServerData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const { refreshGlobalSiteData } = useSite();

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [removeFavicon, setRemoveFavicon] = useState(false);

  const populateState = (data) => {
    setServerData(data);
    setForm({ ...data, ...(data.draft_data || {}) });
    setLogoFile(null);
    setLogoPreview(data.logo_url || null);
    setRemoveLogo(false);
    setFaviconFile(null);
    setFaviconPreview(data.favicon_url || null);
    setRemoveFavicon(false);
    setHasUnsavedEdits(false);
  };

  useEffect(() => {
    adminApi
      .getWebsiteSettings()
      .then(populateState)
      .catch((err) => setFeedback({ type: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedEdits(true);
  };

  const submitWorkflow = async (workflowAction) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      if (workflowAction === 'discard_draft') {
        const res = await adminApi.updateWebsiteSettings(
          toFormData({ workflow_action: 'discard_draft' })
        );
        populateState(res);
        setFeedback({ type: 'success', message: 'Reverted to published website settings.' });
        return;
      }

      const payload = {
        workflow_action: workflowAction,
        business_name: form.business_name,
        tagline: form.tagline,
        supporting_tagline: form.supporting_tagline,
        browser_title: form.browser_title,
        seo_description: form.seo_description,
        seo_keywords: form.seo_keywords,
        primary_navy: form.primary_navy,
        dark_charcoal: form.dark_charcoal,
        golden_yellow: form.golden_yellow,
        bright_yellow: form.bright_yellow,
        warm_cream: form.warm_cream,
        cyan_blue: form.cyan_blue,
        accent_orange: form.accent_orange,
        accent_pink: form.accent_pink,
        footer_text: form.footer_text,
        copyright_text: form.copyright_text,
      };

      if (logoFile) payload.logo = logoFile;
      if (removeLogo) payload.remove_logo = true;
      if (faviconFile) payload.favicon = faviconFile;
      if (removeFavicon) payload.remove_favicon = true;

      const updated = await adminApi.updateWebsiteSettings(toFormData(payload));
      populateState(updated);
      if (workflowAction === 'publish') {
        await refreshGlobalSiteData();
      }
      setFeedback({
        type: 'success',
        message:
          workflowAction === 'save_draft'
            ? 'Global website settings draft saved!'
            : 'Global website settings published live!',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
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
        title="Global Website Settings"
        subtitle="Manage business name, logo, favicon, SEO metadata, brand colors, and footer text."
        hasUnsavedEdits={hasUnsavedEdits}
        hasServerDraft={serverData?.has_unpublished_changes}
        lastPublishedAt={serverData?.last_published_at}
        saving={saving}
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

      {/* Brand Identity & Logo */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-6">
        <h2 className="font-display font-bold text-xl text-[#F6C928]">
          1. Brand Identity &amp; Logos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={form.business_name || ''}
              onChange={(e) => updateField('business_name', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Primary Tagline
            </label>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Supporting Tagline
            </label>
            <input
              type="text"
              value={form.supporting_tagline || ''}
              onChange={(e) => updateField('supporting_tagline', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Official Business Logo
            </label>
            <div className="flex items-center gap-4">
              <img
                src={logoPreview || '/kamalig-logo.png'}
                alt="Logo Preview"
                className="w-16 h-16 rounded-full object-cover bg-[#171B20] border border-[#F6C928]/50 p-0.5"
              />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoPreview ? 'Replace Logo' : 'Upload Custom Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setLogoFile(f);
                        setLogoPreview(URL.createObjectURL(f));
                        setRemoveLogo(false);
                        setHasUnsavedEdits(true);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      setRemoveLogo(true);
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

          {/* Favicon Upload */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Browser Favicon
            </label>
            <div className="flex items-center gap-4">
              <img
                src={faviconPreview || '/kamalig-logo.png'}
                alt="Favicon Preview"
                className="w-12 h-12 rounded-full object-cover bg-[#171B20] border border-[#F6C928]/50 p-0.5"
              />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{faviconPreview ? 'Replace Favicon' : 'Upload Favicon'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFaviconFile(f);
                        setFaviconPreview(URL.createObjectURL(f));
                        setRemoveFavicon(false);
                        setHasUnsavedEdits(true);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO & Social Sharing */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-xl text-[#23C7DF]">
          2. Search Engine Optimization (SEO) &amp; Browser Metadata
        </h2>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Browser Tab Title
          </label>
          <input
            type="text"
            value={form.browser_title || ''}
            onChange={(e) => updateField('browser_title', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Meta Description
          </label>
          <textarea
            rows={3}
            value={form.seo_description || ''}
            onChange={(e) => updateField('seo_description', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
      </div>

      {/* Brand Colors */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-xl text-[#F6C928]">
          3. Main Brand Colors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { key: 'primary_navy', label: 'Deep Navy' },
            { key: 'dark_charcoal', label: 'Dark Charcoal' },
            { key: 'golden_yellow', label: 'Golden Yellow' },
            { key: 'bright_yellow', label: 'Bright Yellow' },
            { key: 'warm_cream', label: 'Warm Cream' },
            { key: 'cyan_blue', label: 'Cyan Blue' },
          ].map((c) => (
            <div
              key={c.key}
              className="p-3 rounded-2xl bg-[#101C28] border border-white/10 space-y-2"
            >
              <label className="block text-[11px] font-bold text-gray-300">{c.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[c.key] || '#101C28'}
                  onChange={(e) => updateField(c.key, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={form[c.key] || ''}
                  onChange={(e) => updateField(c.key, e.target.value)}
                  className="w-full px-2 py-1 rounded bg-[#171B20] text-xs text-white font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Content */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">
          4. Footer &amp; Copyright Text
        </h2>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Footer Description Text
          </label>
          <textarea
            rows={2}
            value={form.footer_text || ''}
            onChange={(e) => updateField('footer_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Copyright Text
          </label>
          <input
            type="text"
            value={form.copyright_text || ''}
            onChange={(e) => updateField('copyright_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>
      </div>
    </div>
  );
}

