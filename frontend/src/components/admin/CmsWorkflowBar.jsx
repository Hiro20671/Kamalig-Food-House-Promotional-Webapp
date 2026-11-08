import React, { useEffect } from 'react';
import {
  Save,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function CmsWorkflowBar({
  title,
  subtitle,
  hasUnsavedEdits = false,
  hasServerDraft = false,
  lastPublishedAt = null,
  saving = false,
  showPreview = false,
  onTogglePreview = null,
  onSaveDraft,
  onPublish,
  onDiscard,
}) {
  // Warn owner before closing browser tab if there are unsaved form edits
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedEdits) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedEdits]);

  return (
    <div className="sticky top-[56px] lg:top-0 z-30 rounded-2xl bg-[#171B20]/95 backdrop-blur-md border border-[#F6C928]/35 p-3.5 sm:p-5 shadow-2xl mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-black text-lg sm:text-2xl text-white">
              {title}
            </h1>
            {hasUnsavedEdits ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-[#F28A32]/20 text-[#F28A32] border border-[#F28A32]/40">
                <AlertTriangle className="w-3 h-3" />
                Unsaved Edits
              </span>
            ) : hasServerDraft ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-[#23C7DF]/20 text-[#23C7DF] border border-[#23C7DF]/40">
                <Clock className="w-3 h-3" />
                Draft Saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" />
                Published Live
              </span>
            )}
          </div>
          {subtitle && (
            <p className="hidden sm:block text-xs sm:text-sm text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {lastPublishedAt && (
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
              Last published: {new Date(lastPublishedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Mobile & Desktop Responsive Workflow Actions */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {onTogglePreview && (
            <button
              type="button"
              onClick={onTogglePreview}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showPreview
                  ? 'bg-[#23C7DF] text-[#101C28] border-[#23C7DF]'
                  : 'bg-[#101C28] text-gray-200 border-white/15 hover:border-[#23C7DF]'
              }`}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>
          )}

          {(hasUnsavedEdits || hasServerDraft) && onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          )}

          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#101C28] hover:bg-white/10 text-[#FFF1C6] border border-[#F6C928]/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#F6C928]" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          )}

          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={saving}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Publish to Website'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
