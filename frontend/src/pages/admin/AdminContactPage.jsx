import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import CmsWorkflowBar from '../../components/admin/CmsWorkflowBar';

export default function AdminContactPage() {
  const [serverData, setServerData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const { refreshGlobalSiteData } = useSite();

  const populateState = (data) => {
    setServerData(data);
    setForm({ ...data, ...(data.draft_data || {}) });
    setHasUnsavedEdits(false);
  };

  useEffect(() => {
    adminApi
      .getContact()
      .then(populateState)
      .catch((err) => setFeedback({ type: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedEdits(true);
  };

  const addSocialLink = () => {
    updateField('other_social_links', [
      ...(form.other_social_links || []),
      { platform: 'Instagram / TikTok', url: '' },
    ]);
  };

  const updateSocialLink = (idx, field, val) => {
    const links = [...(form.other_social_links || [])];
    links[idx] = { ...links[idx], [field]: val };
    updateField('other_social_links', links);
  };

  const removeSocialLink = (idx) => {
    updateField(
      'other_social_links',
      (form.other_social_links || []).filter((_, i) => i !== idx)
    );
  };

  const submitWorkflow = async (workflowAction) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      if (workflowAction === 'discard_draft') {
        const res = await adminApi.updateContact({ workflow_action: 'discard_draft' });
        populateState(res);
        setFeedback({ type: 'success', message: 'Reverted to published contact details.' });
        return;
      }

      const payload = {
        workflow_action: workflowAction,
        business_name: form.business_name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        facebook_url: form.facebook_url,
        facebook_page_name: form.facebook_page_name,
        messenger_url: form.messenger_url,
        other_social_links: form.other_social_links || [],
        operating_hours: form.operating_hours,
        contact_instructions: form.contact_instructions,
        show_phone: form.show_phone,
        show_email: form.show_email,
        show_facebook: form.show_facebook,
        show_messenger: form.show_messenger,
        show_address: form.show_address,
        show_operating_hours: form.show_operating_hours,
      };

      const updated = await adminApi.updateContact(payload);
      populateState(updated);
      if (workflowAction === 'publish') {
        await refreshGlobalSiteData();
      }
      setFeedback({
        type: 'success',
        message:
          workflowAction === 'save_draft'
            ? 'Contact draft saved!'
            : 'Contact details published live to Contact Us & Footer!',
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
        title="Contact Us & Social Channels Editor"
        subtitle="Add, edit, or hide phone numbers, Facebook Page, Messenger link, email address, and operating hours."
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

      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F6C928]">
                Phone / Mobile Number
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_phone !== false}
                  onChange={(e) => updateField('show_phone', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Visible
              </label>
            </div>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Enter official contact number (leave blank to hide)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
            />
          </div>

          {/* Email */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F28A32]">
                Email Address
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_email !== false}
                  onChange={(e) => updateField('show_email', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Visible
              </label>
            </div>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="Enter official email address (optional)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
            />
          </div>

          {/* Facebook Page */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#23C7DF]">
                Official Facebook Page
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_facebook !== false}
                  onChange={(e) => updateField('show_facebook', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Visible
              </label>
            </div>
            <input
              type="text"
              value={form.facebook_page_name || ''}
              onChange={(e) => updateField('facebook_page_name', e.target.value)}
              placeholder="Facebook Page Display Name (e.g., Kamalig Food House)"
              className="w-full px-3.5 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
            <input
              type="url"
              value={form.facebook_url || ''}
              onChange={(e) => updateField('facebook_url', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#171B20] border border-white/10 text-xs text-white"
            />
          </div>

          {/* Messenger URL */}
          <div className="p-4 rounded-2xl bg-[#101C28] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#23C7DF]">
                Direct Messenger Link
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_messenger !== false}
                  onChange={(e) => updateField('show_messenger', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Visible
              </label>
            </div>
            <input
              type="url"
              value={form.messenger_url || ''}
              onChange={(e) => updateField('messenger_url', e.target.value)}
              placeholder="https://m.me/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171B20] border border-white/10 text-sm text-white"
            />
          </div>
        </div>

        {/* Address & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Business Address
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_address !== false}
                  onChange={(e) => updateField('show_address', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Show Address
              </label>
            </div>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Operating Hours
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_operating_hours !== false}
                  onChange={(e) => updateField('show_operating_hours', e.target.checked)}
                  className="accent-[#F6C928]"
                />
                Show Hours
              </label>
            </div>
            <input
              type="text"
              value={form.operating_hours || ''}
              onChange={(e) => updateField('operating_hours', e.target.value)}
              placeholder="e.g., Daily 9:00 AM - 9:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
            Contact Instructions / Welcome Message
          </label>
          <textarea
            rows={3}
            value={form.contact_instructions || ''}
            onChange={(e) => updateField('contact_instructions', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
          />
        </div>

        {/* Additional Social Links */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Additional Social Media Links
            </label>
            <button
              type="button"
              onClick={addSocialLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6C928] text-[#101C28] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Social Link
            </button>
          </div>

          {(form.other_social_links || []).map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.platform || ''}
                onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                placeholder="Platform (e.g., Instagram, TikTok)"
                className="w-1/3 px-3 py-2 rounded-xl bg-[#101C28] border border-white/15 text-xs text-white"
              />
              <input
                type="url"
                value={item.url || ''}
                onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#101C28] border border-white/15 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => removeSocialLink(idx)}
                className="p-2 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

