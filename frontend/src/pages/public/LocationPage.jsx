import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Clock,
  ExternalLink,
  Search,
  AlertCircle,
  CheckCircle2,
  LocateFixed,
} from 'lucide-react';
import { publicApi } from '../../services/api';
import InteractiveKamaligMap from '../../components/map/InteractiveKamaligMap';

export default function LocationPage() {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Visitor Geolocation & Routing state
  const [visitorCoords, setVisitorCoords] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null); // { distanceKm, durationMin }
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [searchingManual, setSearchingManual] = useState(false);

  useEffect(() => {
    let mounted = true;
    publicApi
      .getLocation()
      .then((data) => {
        if (mounted) setLocationData(data);
      })
      .catch((err) => console.error('Failed to load location:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const destLat = Number(locationData?.latitude) || 13.9412;
  const destLng = Number(locationData?.longitude) || 121.6445;
  const businessName = locationData?.business_name || 'Kamalig Food House';
  const address =
    locationData?.address || '130 CCF Village, Brgy. Mayao Parada, Lucena City';

  // Calculate route using OSRM public routing service
  const computeRouteToKamalig = async (startLat, startLng, label) => {
    setVisitorCoords({ lat: startLat, lng: startLng, label });
    setGeoError('');
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteGeometry(coords);
        setRouteSummary({
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMin: Math.max(1, Math.round(route.duration / 60)),
        });
      } else {
        setRouteGeometry([
          [startLat, startLng],
          [destLat, destLng],
        ]);
        setRouteSummary(null);
      }
    } catch {
      setRouteGeometry([
        [startLat, startLng],
        [destLat, destLng],
      ]);
      setRouteSummary(null);
    }
  };

  // Trigger Browser Geolocation when visitor clicks "Get Directions to Kamalig"
  const handleGetDirections = () => {
    setGeoError('');
    if (!('geolocation' in navigator)) {
      setGeoError('Browser geolocation is not supported on this device. Please enter your starting location below.');
      setShowManualInput(true);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false);
        await computeRouteToKamalig(
          position.coords.latitude,
          position.coords.longitude,
          'Your Current Location'
        );
      },
      () => {
        setLocating(false);
        setGeoError(
          'Location permission was denied or unavailable. You can enter your starting location manually below or open Google Maps directly.'
        );
        setShowManualInput(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Manual starting location geocoding fallback
  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setSearchingManual(true);
    setGeoError('');
    try {
      const q = encodeURIComponent(manualQuery.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const startLat = parseFloat(results[0].lat);
        const startLng = parseFloat(results[0].lon);
        await computeRouteToKamalig(startLat, startLng, results[0].display_name);
      } else {
        setGeoError('Could not find that starting location. Try adding "Lucena City" or opening Google Maps directly.');
      }
    } catch {
      setGeoError('Unable to look up starting address right now. Use the Google Maps button below.');
    } finally {
      setSearchingManual(false);
    }
  };

  const googleMapsDirectionsUrl = visitorCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${visitorCoords.lat},${visitorCoords.lng}&destination=${destLat},${destLng}&travelmode=driving`
    : manualQuery.trim()
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(manualQuery.trim())}&destination=${destLat},${destLng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

  const openStreetMapDirectionsUrl = visitorCoords
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${visitorCoords.lat}%2C${visitorCoords.lng}%3B${destLat}%2C${destLng}`
    : `https://www.openstreetmap.org/?mlat=${destLat}&mlon=${destLng}#map=17/${destLat}/${destLng}`;

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#101C28] text-white min-h-screen pb-20">
      {/* Page Header */}
      <section className="bg-gradient-to-b from-[#171B20] to-[#101C28] border-b border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6C928]/15 border border-[#F6C928]/35 text-[#F6C928] text-xs font-extrabold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Store Location &amp; Route Finder</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white">
              Find <span className="text-[#F6C928]">Kamalig Food House</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Visit us at <strong className="text-white">{address}</strong>. Use our interactive map below to get live directions from your current location.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Directions Controls & Location Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Prominent Get Directions Card */}
            <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/40 p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="space-y-2">
                <h2 className="font-display font-black text-2xl text-white">
                  Navigate to Kamalig
                </h2>
                <p className="text-sm text-gray-300">
                  Click below to detect your location and plot the fastest route to Kamalig Food House on the map.
                </p>
              </div>

              {/* Prominent "Get Directions to Kamalig" Button */}
              <button
                type="button"
                onClick={handleGetDirections}
                disabled={locating}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-display font-extrabold text-base bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-xl shadow-[#F6C928]/20 transition-all cursor-pointer disabled:opacity-60"
              >
                <LocateFixed className={`w-5 h-5 ${locating ? 'animate-spin' : ''}`} />
                <span>
                  {locating ? 'Detecting Your Location...' : 'Get Directions to Kamalig'}
                </span>
              </button>

              {/* Toggle Manual Starting Point Input */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Prefer to type your starting point?</span>
                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="text-[#F6C928] hover:underline font-bold cursor-pointer"
                >
                  {showManualInput ? 'Hide Manual Entry' : 'Enter Location Manually'}
                </button>
              </div>

              {showManualInput && (
                <form onSubmit={handleManualLocationSubmit} className="space-y-2 pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#FFF1C6]">
                    Starting Address or Landmark
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="e.g., SM City Lucena, Pacific Mall Lucena..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F6C928]"
                    />
                    <button
                      type="submit"
                      disabled={searchingManual}
                      className="px-4 py-2.5 rounded-xl bg-[#23C7DF] text-[#101C28] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      {searchingManual ? '...' : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              )}

              {/* Geolocation / Search Alert */}
              {geoError && (
                <div className="p-3.5 rounded-xl bg-[#F28A32]/15 border border-[#F28A32]/40 text-xs text-[#FFF1C6] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#F28A32] flex-shrink-0 mt-0.5" />
                  <span>{geoError}</span>
                </div>
              )}

              {/* Active Route Summary */}
              {visitorCoords && (
                <div className="p-4 rounded-2xl bg-[#101C28] border border-[#23C7DF]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#23C7DF]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Route Plotted on Map</span>
                  </div>
                  {routeSummary && (
                    <div className="flex items-center gap-4 pt-1">
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Distance</p>
                        <p className="font-display font-black text-lg text-white">
                          {routeSummary.distanceKm} km
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Est. Drive</p>
                        <p className="font-display font-black text-lg text-[#F6C928]">
                          ~{routeSummary.durationMin} mins
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* External Navigation Service Links */}
              <div className="pt-2 border-t border-white/10 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Open Full Turn-by-Turn Navigation
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-[#F6C928]" />
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                  <a
                    href={openStreetMapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                  >
                    <Compass className="w-4 h-4 text-[#23C7DF]" />
                    <span>OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>

            {/* Official Location Information Card */}
            <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F6C928] mb-1">
                  Official Business Address
                </h3>
                <p className="font-display font-bold text-lg text-white">{businessName}</p>
                <p className="text-gray-300 text-sm mt-1">{address}</p>
              </div>

              {locationData?.nearby_landmarks && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#23C7DF] mb-1">
                    Nearby Landmarks
                  </h4>
                  <p className="text-sm text-gray-300 whitespace-pre-line">
                    {locationData.nearby_landmarks}
                  </p>
                </div>
              )}

              {locationData?.business_hours && (
                <div className="pt-4 border-t border-white/10 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#F6C928] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F6C928] mb-1">
                      Business Hours
                    </h4>
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {locationData.business_hours}
                    </p>
                  </div>
                </div>
              )}

              {locationData?.directions_information && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FFF1C6] mb-1">
                    Location Instructions
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {locationData.directions_information}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-7 space-y-4">
            <InteractiveKamaligMap
              latitude={destLat}
              longitude={destLng}
              zoom={locationData?.map_zoom || 16}
              businessName={businessName}
              address={address}
              visitorCoords={visitorCoords}
              routeGeometry={routeGeometry}
              heightClass="h-[520px] sm:h-[600px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 px-2">
              <span>
                Coordinates: {destLat.toFixed(5)}, {destLng.toFixed(5)}
              </span>
              <span>Use mouse wheel or + / - buttons to zoom and pan the map.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

