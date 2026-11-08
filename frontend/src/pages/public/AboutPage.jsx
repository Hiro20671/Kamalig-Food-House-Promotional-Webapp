import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, MapPin, Utensils, Eye, Heart } from 'lucide-react';
import { publicApi } from '../../services/api';
import KamaligLogo from '../../components/common/KamaligLogo';

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    publicApi
      .getAbout()
      .then((data) => {
        if (mounted) setAbout(data);
      })
      .catch((err) => console.error('Failed to load About Us:', err))
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

  const a = about || {};
  const hasStory = a.show_story && a.business_story && a.business_story.trim().length > 0;
  const hasMission = a.show_mission && a.mission && a.mission.trim().length > 0;
  const hasVision = a.show_vision && a.vision && a.vision.trim().length > 0;
  const galleryImages = a.images || [];
  const whyVisitItems = Array.isArray(a.why_visit_items) ? a.why_visit_items : [];

  return (
    <div className="bg-[#101C28] text-white pb-20">
      {/* Editorial Hero Header */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-[#171B20] to-[#101C28] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex justify-center">
            <KamaligLogo size="lg" />
          </div>
          {a.subtitle && (
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#F6C928]">
              {a.subtitle}
            </p>
          )}
          <h1 className="font-display font-black text-4xl sm:text-6xl text-white">
            {a.title || 'About Kamalig Food House'}
          </h1>
          {a.introduction && (
            <p className="text-base sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              {a.introduction}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-16">
        {/* Business Story Section (Hidden automatically if owner has not added content) */}
        {hasStory && (
          <section className="rounded-3xl bg-[#171B20] border border-white/10 p-8 sm:p-12 shadow-xl">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#F6C928] mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Kamalig Heritage</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-4">
              {a.story_heading || 'Our Story'}
            </h2>
            <div className="text-gray-200 leading-relaxed space-y-4 whitespace-pre-line text-base sm:text-lg">
              {a.business_story}
            </div>
          </section>
        )}

        {/* Mission & Vision Grid (Hidden automatically until owner provides content) */}
        {(hasMission || hasVision) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hasMission && (
              <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/30 p-8 sm:p-10 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-2xl text-white mb-3">
                  {a.mission_heading || 'Our Mission'}
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {a.mission}
                </p>
              </div>
            )}

            {hasVision && (
              <div className="rounded-3xl bg-[#171B20] border border-[#23C7DF]/30 p-8 sm:p-10 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-[#23C7DF]/15 text-[#23C7DF] flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-2xl text-white mb-3">
                  {a.vision_heading || 'Our Vision'}
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {a.vision}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Brand Identity Section */}
        {a.show_brand_identity !== false && a.brand_identity_text && (
          <section className="rounded-3xl bg-[#FFF1C6] text-[#101C28] p-8 sm:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#101C28] text-[#F6C928]">
                  Brand Promise
                </span>
                <h2 className="font-display font-black text-3xl text-[#101C28]">
                  {a.brand_identity_heading || 'Our Brand Identity'}
                </h2>
                <p className="text-[#171B20]/90 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                  {a.brand_identity_text}
                </p>
              </div>
              <div className="lg:col-span-4 rounded-2xl bg-[#101C28] text-white p-6 text-center space-y-2 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-[#23C7DF]">
                  Signature Tagline
                </p>
                <p className="font-display font-black text-2xl text-[#F6C928]">
                  “Good Food, Great Mood!”
                </p>
                <p className="text-sm font-bold text-[#FFF1C6]">“Sarap na Abot-Kaya!”</p>
              </div>
            </div>
          </section>
        )}

        {/* Why Visit Kamalig Food House */}
        {a.show_why_visit !== false && whyVisitItems.length > 0 && (
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {a.why_visit_heading || 'Why Visit Kamalig Food House?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whyVisitItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Uploaded Business Photographs Gallery */}
        {a.show_gallery !== false && galleryImages.length > 0 && (
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="font-display font-black text-3xl text-white">
                {a.gallery_heading || 'Inside Kamalig Food House'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="rounded-2xl overflow-hidden bg-[#171B20] border border-white/10 shadow-lg group"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || img.caption || 'Kamalig Food House'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {img.caption && (
                    <div className="p-4 text-sm text-gray-200 font-medium">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-[#171B20] to-[#1d2b3a] border border-[#F6C928]/30 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-extrabold text-2xl text-white">
              Ready to browse our menu or visit us in person?
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Located at 130 CCF Village, Brgy. Mayao Parada, Lucena City.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#F6C928] text-[#101C28] hover:bg-[#FFD83D] transition-colors"
            >
              <Utensils className="w-4 h-4" />
              Explore Menu
            </Link>
            <Link
              to="/location"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#F6C928]" />
              Get Directions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

