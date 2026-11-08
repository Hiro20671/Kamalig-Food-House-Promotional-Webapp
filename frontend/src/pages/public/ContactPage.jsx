import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  Facebook,
  MessageCircle,
  MapPin,
  Clock,
  Navigation,
  ExternalLink,
  Sparkles,
  Globe,
} from 'lucide-react';
import { publicApi } from '../../services/api';

export default function ContactPage() {
  const [contact, setContact] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([publicApi.getContact(), publicApi.getLocation()])
      .then(([contactData, locData]) => {
        if (!mounted) return;
        setContact(contactData);
        setLocation(locData);
      })
      .catch((err) => console.error('Contact page error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
      </div>
    );
  }

  const c = contact || {};
  const address =
    c.address ||
    location?.address ||
    '130 CCF Village, Brgy. Mayao Parada, Lucena City';
  const hours = c.operating_hours || location?.business_hours || '';
  const hasPhone = c.show_phone && Boolean(c.phone && c.phone.trim());
  const hasEmail = c.show_email && Boolean(c.email && c.email.trim());
  const hasFacebook = c.show_facebook && Boolean(c.facebook_url && c.facebook_url.trim());
  const hasMessenger = c.show_messenger && Boolean(c.messenger_url && c.messenger_url.trim());
  const socialLinks = Array.isArray(c.other_social_links) ? c.other_social_links : [];

  return (
    <div className="bg-[#101C28] text-white min-h-screen pb-20">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#171B20] to-[#101C28] border-b border-white/10 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6C928]/15 border border-[#F6C928]/35 text-[#F6C928] text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-white">
            Contact <span className="text-[#F6C928]">Kamalig Food House</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {c.contact_instructions ||
              'Have questions about our menu, location, or operating hours? Reach out to Kamalig Food House or visit our store in Lucena City.'}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        {/* Clickable Contact Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Open Location Action (Always available with verified address) */}
          <Link
            to="/location"
            className="rounded-3xl bg-[#171B20] border border-[#F6C928]/35 hover:border-[#F6C928] p-7 flex flex-col justify-between gap-6 shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F6C928] text-[#101C28] flex items-center justify-center shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F6C928] mb-1">
                Physical Storefront
              </p>
              <h2 className="font-display font-extrabold text-xl text-white mb-2">
                Open Location
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">{address}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F6C928]">
              <Navigation className="w-3.5 h-3.5" />
              Get Directions
            </span>
          </Link>

          {/* Call Now Action (Shown when owner configures phone number) */}
          {hasPhone && (
            <a
              href={`tel:${c.phone}`}
              className="rounded-3xl bg-[#171B20] border border-white/10 hover:border-[#F6C928] p-7 flex flex-col justify-between gap-6 shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Phone Number
                </p>
                <h2 className="font-display font-extrabold text-xl text-white mb-2">
                  Call Now
                </h2>
                <p className="text-sm font-semibold text-[#FFF1C6]">{c.phone}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F6C928]">
                Tap to Call
              </span>
            </a>
          )}

          {/* Message on Facebook / Messenger */}
          {(hasFacebook || hasMessenger) && (
            <a
              href={hasMessenger ? c.messenger_url : c.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl bg-[#171B20] border border-white/10 hover:border-[#23C7DF] p-7 flex flex-col justify-between gap-6 shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#23C7DF]/15 text-[#23C7DF] flex items-center justify-center">
                {hasMessenger ? (
                  <MessageCircle className="w-6 h-6" />
                ) : (
                  <Facebook className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Social Connect
                </p>
                <h2 className="font-display font-extrabold text-xl text-white mb-2">
                  Message on Facebook
                </h2>
                <p className="text-xs text-gray-300">
                  {c.facebook_page_name || 'Kamalig Food House'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#23C7DF]">
                <span>Open Facebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          )}

          {/* Email Us Action (Shown when owner configures email) */}
          {hasEmail && (
            <a
              href={`mailto:${c.email}`}
              className="rounded-3xl bg-[#171B20] border border-white/10 hover:border-[#F6C928] p-7 flex flex-col justify-between gap-6 shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F28A32]/15 text-[#F28A32] flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Email Address
                </p>
                <h2 className="font-display font-extrabold text-xl text-white mb-2">
                  Email Us
                </h2>
                <p className="text-xs text-gray-300 break-all">{c.email}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F28A32]">
                Send Email
              </span>
            </a>
          )}
        </div>

        {/* Complete Storefront Details Card */}
        <div className="rounded-3xl bg-[#171B20] border border-white/10 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#F6C928]">
                Visit Our Food House
              </span>
              <h2 className="font-display font-black text-3xl text-white mt-1">
                {c.business_name || 'Kamalig Food House'}
              </h2>
            </div>

            {c.show_address !== false && (
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#F6C928] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Address
                  </h3>
                  <p className="text-base text-white font-semibold mt-0.5">{address}</p>
                </div>
              </div>
            )}

            {c.show_operating_hours !== false && hours && (
              <div className="flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#23C7DF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Operating Hours
                  </h3>
                  <p className="text-base text-white font-semibold mt-0.5 whitespace-pre-line">
                    {hours}
                  </p>
                </div>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Other Social Channels
                </h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#101C28] border border-white/15 hover:border-[#F6C928] text-xs font-bold text-white transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#F6C928]" />
                      <span>{link.platform || link.label || 'Social Link'}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[#101C28] border border-[#F6C928]/30 p-8 text-center space-y-4">
            <img
              src="/kamalig-logo.png"
              alt="Kamalig Food House Official Logo"
              className="w-24 h-24 mx-auto rounded-full border-2 border-[#F6C928] shadow-xl object-cover"
            />
            <h3 className="font-display font-black text-2xl text-[#F6C928]">
              Good Food, Great Mood!
            </h3>
            <p className="text-sm text-[#FFF1C6]">Sarap na Abot-Kaya!</p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/menu"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-[#F6C928] text-[#101C28] hover:bg-[#FFD83D] transition-colors"
              >
                Browse Digital Menu
              </Link>
              <Link
                to="/location"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                Interactive Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

