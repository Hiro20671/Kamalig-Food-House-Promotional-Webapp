import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { publicApi } from '../services/api';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [contact, setContact] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshGlobalSiteData = useCallback(async () => {
    try {
      const [settingsData, contactData, locationData] = await Promise.all([
        publicApi.getWebsiteSettings(),
        publicApi.getContact(),
        publicApi.getLocation(),
      ]);
      setSettings(settingsData);
      setContact(contactData);
      setLocation(locationData);
    } catch (err) {
      console.error('Failed to load public site settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGlobalSiteData();
  }, [refreshGlobalSiteData]);

  // Apply dynamic SEO metadata, favicon, brand CSS variables, and LocalBusiness structured data
  useEffect(() => {
    if (!settings) return;

    if (settings.browser_title) {
      document.title = settings.browser_title;
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && settings.seo_description) {
      metaDesc.setAttribute('content', settings.seo_description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && settings.browser_title) {
      ogTitle.setAttribute('content', settings.browser_title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && settings.seo_description) {
      ogDesc.setAttribute('content', settings.seo_description);
    }

    if (settings.favicon_url) {
      let faviconLink = document.querySelector("link[rel~='icon']");
      if (faviconLink) {
        faviconLink.href = settings.favicon_url;
      }
    }

    const root = document.documentElement;
    if (settings.primary_navy) root.style.setProperty('--kamalig-navy', settings.primary_navy);
    if (settings.dark_charcoal) root.style.setProperty('--kamalig-charcoal', settings.dark_charcoal);
    if (settings.golden_yellow) root.style.setProperty('--kamalig-gold', settings.golden_yellow);
    if (settings.bright_yellow) root.style.setProperty('--kamalig-bright-yellow', settings.bright_yellow);
    if (settings.warm_cream) root.style.setProperty('--kamalig-cream', settings.warm_cream);
    if (settings.cyan_blue) root.style.setProperty('--kamalig-cyan', settings.cyan_blue);

    // Inject LocalBusiness JSON-LD structured data for SEO (Section 13)
    const ldJsonId = 'kamalig-local-business-jsonld';
    let scriptEl = document.getElementById(ldJsonId);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = ldJsonId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: settings.business_name || 'Kamalig Food House',
      description: settings.seo_description || 'Good Food, Great Mood! Sarap na Abot-Kaya!',
      slogan: `${settings.tagline || 'Good Food, Great Mood!'} — ${settings.supporting_tagline || 'Sarap na Abot-Kaya!'}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: location?.address || contact?.address || '130 CCF Village, Brgy. Mayao Parada',
        addressLocality: 'Lucena City',
        addressCountry: 'PH',
      },
      ...(location?.latitude && location?.longitude
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: location.latitude,
              longitude: location.longitude,
            },
          }
        : {}),
      ...(contact?.phone ? { telephone: contact.phone } : {}),
      ...(contact?.email ? { email: contact.email } : {}),
      servesCuisine: ['Filipino', 'Silog Meals', 'Short Orders', 'Burgers', 'Coffee', 'Refreshers'],
    };
    scriptEl.textContent = JSON.stringify(structuredData);
  }, [settings, contact, location]);

  return (
    <SiteContext.Provider
      value={{
        settings,
        contact,
        location,
        loading,
        refreshGlobalSiteData,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}

