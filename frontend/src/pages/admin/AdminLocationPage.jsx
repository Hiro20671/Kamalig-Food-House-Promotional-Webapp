import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import CmsWorkflowBar from '../../components/admin/CmsWorkflowBar';
import InteractiveKamaligMap from '../../components/map/InteractiveKamaligMap';

export default function AdminLocationPage() {
  const [serverData, setServerData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [addressQuery, setAddressQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const { refreshGlobalSiteData } = useSite();

  const populateState = (data) => {
    setServerData(data);
    setForm({ ...data, ...(data.draft_data || {}) });
    setHasUnsavedEdits(false);
  };

  useEffect(() => {
    adminApi
      .getLocation()
      .then(populateState)
      .catch((err) => setFeedback({ type: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedEdits(true);
  };

  // Search address on OpenStreetMap Nominatim to reposition the map marker
  const handleSearchAddressOnMap = async (e) => {
    e.preventDefault();
    const query = addressQuery.trim() || form?.address;
    if (!query) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const lat = Number(parseFloat(results[0].lat).toFixed(6));
        const lng = Number(parseFloat(results[0].lon).toFixed(6));
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setHasUnsavedEdits(true);
        setFeedback({
          type: 'success',
          message: `Moved map pin to "${results[0].display_name}". You can fine-tune by dragging the K pin on the map.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Address not found by geocoder. Try searching "Mayao Parada, Lucena City" or drag the marker directly on the map.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Address search failed. You can click or drag the marker directly on the map.' });
    } finally {
      setGeocoding(false);
    }
  };

  const submitWorkflow = async (workflowAction) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      if (workflowAction === 'discard_draft') {
        const res = await adminApi.updateLocation({ workflow_action: 'discard_draft' });
        populateState(res);
        setFeedback({ type: 'success', message: 'Reverted to published location settings.' });
        return;
      }

      const payload = {
        workflow_action: workflowAction,
        business_name: form.business_name,
        address: form.address,
        latitude: Number(form.latitude) || 13.9412,
        longitude: Number(form.longitude) || 121.6445,
        map_zoom: Number(form.map_zoom) || 16,
        nearby_landmarks: form.nearby_landmarks,
        directions_information: form.directions_information,
        business_hours: form.business_hours,
        google_maps_url: form.google_maps_url,
      };

      const updated = await adminApi.updateLocation(payload);
      populateState(updated);
      if (workflowAction === 'publish') {
        await refreshGlobalSiteData();
      }
      setFeedback({
        type: 'success',
        message:
          workflowAction === 'save_draft'
            ? 'Location draft saved!'
            : 'Location & map coordinates published live to the public website!',
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
        title="Location & Interactive Map Editor"
        subtitle="Configure the official business address, exact map coordinates, nearby landmarks, business hours, and directions instructions."
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form Inputs */}
        <div className="lg:col-span-5 rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#F6C928]">
            Address &amp; Coordinates
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Business Name on Map Pin
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
              Official Business Address
            </label>
            <textarea
              rows={2}
              value={form.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude ?? 13.9412}
                onChange={(e) => updateField('latitude', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#101C28] border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude ?? 121.6445}
                onChange={(e) => updateField('longitude', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#101C28] border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Map Zoom
              </label>
              <input
                type="number"
                min={10}
                max={19}
                value={form.map_zoom ?? 16}
                onChange={(e) => updateField('map_zoom', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#101C28] border border-white/15 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Nearby Landmarks
            </label>
            <textarea
              rows={2}
              value={form.nearby_landmarks || ''}
              onChange={(e) => updateField('nearby_landmarks', e.target.value)}
              placeholder="e.g., Near CCF Village entrance, Brgy. Mayao Parada..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Business Hours
            </label>
            <input
              type="text"
              value={form.business_hours || ''}
              onChange={(e) => updateField('business_hours', e.target.value)}
              placeholder="e.g., Mon - Sun: 9:00 AM - 9:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Directions &amp; Location Instructions
            </label>
            <textarea
              rows={3}
              value={form.directions_information || ''}
              onChange={(e) => updateField('directions_information', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        {/* Right: Interactive Map Marker Editor */}
        <div className="lg:col-span-7 rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#23C7DF]">
              Interactive Map Marker Editor
            </h2>
            <p className="text-xs text-gray-400">
              Search an address below, or click/drag the <strong className="text-[#F6C928]">K</strong> marker on the map to set the exact storefront pin.
            </p>
          </div>

          <form onSubmit={handleSearchAddressOnMap} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              placeholder="Search address on map (e.g., Mayao Parada, Lucena City)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-xs sm:text-sm text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={geocoding}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#23C7DF] text-[#101C28] font-bold text-xs cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{geocoding ? 'Locating...' : 'Find on Map'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!('geolocation' in navigator)) {
                    setFeedback({ type: 'error', message: 'GPS is not supported on this browser.' });
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = Number(pos.coords.latitude.toFixed(6));
                      const lng = Number(pos.coords.longitude.toFixed(6));
                      setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                      setHasUnsavedEdits(true);
                      setFeedback({
                        type: 'success',
                        message: `Pin set to your phone's GPS coordinates (${lat}, ${lng})! Tap "Publish to Website" to save.`,
                      });
                    },
                    () => {
                      setFeedback({
                        type: 'error',
                        message: 'Could not read GPS location. Please allow location permission or drag the map pin manually.',
                      });
                    },
                    { enableHighAccuracy: true }
                  );
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F6C928] text-[#101C28] font-bold text-xs cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Use My GPS</span>
              </button>
            </div>
          </form>

          <InteractiveKamaligMap
            latitude={form.latitude}
            longitude={form.longitude}
            zoom={form.map_zoom}
            businessName={form.business_name}
            address={form.address}
            editable={true}
            onLocationChange={(lat, lng) => {
              setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
              setHasUnsavedEdits(true);
            }}
            heightClass="h-[460px]"
          />
        </div>
      </div>
    </div>
  );
}

