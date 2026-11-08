import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Custom branded SVG Pin for Kamalig Food House
const createKamaligIcon = () =>
  L.divIcon({
    className: 'kamalig-custom-pin',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50% 50% 50% 0;
        background: #F6C928;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.45);
        border: 3px solid #101C28;
      ">
        <div style="
          transform: rotate(45deg);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #101C28;
          color: #F6C928;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">K</div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -42],
  });

const createVisitorIcon = () =>
  L.divIcon({
    className: 'visitor-custom-pin',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #23C7DF;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 6px rgba(35, 199, 223, 0.35), 0 4px 10px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });

export default function InteractiveKamaligMap({
  latitude = 13.9412,
  longitude = 121.6445,
  zoom = 16,
  businessName = 'Kamalig Food House',
  address = '130 CCF Village, Brgy. Mayao Parada, Lucena City',
  visitorCoords = null, // { lat, lng, label }
  routeGeometry = null, // Array of [lat, lng] coordinates
  editable = false,
  onLocationChange = null, // (lat, lng) => void
  heightClass = 'h-[420px]',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const businessMarkerRef = useRef(null);
  const visitorMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const safeLat = Number(latitude) || 13.9412;
  const safeLng = Number(longitude) || 121.6445;
  const safeZoom = Number(zoom) || 16;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [safeLat, safeLng],
      zoom: safeZoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([safeLat, safeLng], {
      icon: createKamaligIcon(),
      draggable: editable,
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; padding: 2px;">
        <div style="font-weight: 800; font-size: 14px; color: #101C28; margin-bottom: 3px;">
          ${businessName}
        </div>
        <div style="font-size: 12px; color: #374151; line-height: 1.4;">
          ${address}
        </div>
      </div>
    `);

    if (editable && onLocationChange) {
      marker.on('dragend', (event) => {
        const pos = event.target.getLatLng();
        onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      map.on('click', (event) => {
        const { lat, lng } = event.latlng;
        marker.setLatLng([lat, lng]);
        onLocationChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });
    }

    mapInstanceRef.current = map;
    businessMarkerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update business marker when coordinates or address change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = businessMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([safeLat, safeLng]);
    marker.setPopupContent(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; padding: 2px;">
        <div style="font-weight: 800; font-size: 14px; color: #101C28; margin-bottom: 3px;">
          ${businessName}
        </div>
        <div style="font-size: 12px; color: #374151; line-height: 1.4;">
          ${address}
        </div>
      </div>
    `);

    if (!visitorCoords) {
      map.setView([safeLat, safeLng], safeZoom);
    }
  }, [safeLat, safeLng, safeZoom, businessName, address]);

  // Update visitor marker & route polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (visitorMarkerRef.current) {
      map.removeLayer(visitorMarkerRef.current);
      visitorMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (visitorCoords && visitorCoords.lat && visitorCoords.lng) {
      const vMarker = L.marker([visitorCoords.lat, visitorCoords.lng], {
        icon: createVisitorIcon(),
      }).addTo(map);
      vMarker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #101C28;">
          ${visitorCoords.label || 'Your Starting Location'}
        </div>
      `);
      visitorMarkerRef.current = vMarker;

      const coordsToDraw =
        routeGeometry && routeGeometry.length > 1
          ? routeGeometry
          : [
              [visitorCoords.lat, visitorCoords.lng],
              [safeLat, safeLng],
            ];

      const polyline = L.polyline(coordsToDraw, {
        color: '#101C28',
        weight: 7,
        opacity: 0.85,
      }).addTo(map);

      const innerPolyline = L.polyline(coordsToDraw, {
        color: '#23C7DF',
        weight: 4,
        opacity: 1,
      }).addTo(map);

      routeLineRef.current = L.layerGroup([polyline, innerPolyline]).addTo(map);

      const bounds = L.latLngBounds([
        [visitorCoords.lat, visitorCoords.lng],
        [safeLat, safeLng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [visitorCoords, routeGeometry, safeLat, safeLng]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-white/15 shadow-xl`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {editable && (
        <div className="absolute bottom-3 left-3 z-[400] bg-[#101C28]/90 backdrop-blur-md text-xs text-[#FFF1C6] px-3 py-2 rounded-xl border border-[#F6C928]/40 shadow-lg pointer-events-none">
          Tip: Click anywhere on the map or drag the <strong className="text-[#F6C928]">K</strong> marker to set exact coordinates.
        </div>
      )}
    </div>
  );
}

