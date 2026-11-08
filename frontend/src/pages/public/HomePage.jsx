import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Utensils,
  CupSoda,
  Sparkles,
  MapPin,
  Navigation,
  ArrowRight,
  Award,
  Flame,
  Coffee,
  Heart,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { publicApi } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import KamaligLogo from '../../components/common/KamaligLogo';
import ProductCard from '../../components/common/ProductCard';
import ProductDetailModal from '../../components/common/ProductDetailModal';
import InteractiveKamaligMap from '../../components/map/InteractiveKamaligMap';

const ICON_MAP = {
  Utensils,
  CupSoda,
  Sparkles,
  Flame,
  Coffee,
  Award,
  Heart,
  ShieldCheck,
  Star,
};

export default function HomePage() {
  const [homepage, setHomepage] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { location } = useSite();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      publicApi.getHomepage(),
      publicApi.getFeaturedProducts(),
      publicApi.getBestSellers(),
      publicApi.getPromotions(),
    ])
      .then(([homeData, featuredData, bestSellerData, promoData]) => {
        if (!mounted) return;
        setHomepage(homeData);
        setFeaturedProducts(featuredData || []);
        setBestSellers(bestSellerData || []);
        setPromotions(promoData || []);
      })
      .catch((err) => console.error('Homepage load error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-[#FFF1C6]">Loading Kamalig Food House...</p>
        </div>
      </div>
    );
  }

  const h = homepage || {};
  const sectionOrder = Array.isArray(h.section_order) && h.section_order.length > 0
    ? h.section_order
    : [
        'hero',
        'featured',
        'best_sellers',
        'promotions',
        'why_choose',
        'about_preview',
        'location_preview',
      ];

  const renderHero = () => {
    if (h.show_hero === false) return null;
    return (
      <section
        key="hero"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-white/10"
        style={
          h.hero_background_image_url
            ? {
                backgroundImage: `linear-gradient(to right, rgba(16,28,40,0.94), rgba(16,28,40,0.78)), url(${h.hero_background_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Ambient Glow Accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#F6C928]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#23C7DF]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Text Column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#171B20]/90 border border-[#F6C928]/35 shadow-lg">
                <KamaligLogo size="sm" />
              </div>

              {h.show_hero_subtitle !== false && h.hero_subtitle && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6C928]/15 border border-[#F6C928]/40 text-[#F6C928] text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>{h.hero_subtitle}</span>
                </div>
              )}

              <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.06]">
                {h.hero_title || 'Good Food, Great Mood!'}
              </h1>

              {h.show_hero_description !== false && h.hero_description && (
                <p className="text-base sm:text-lg text-gray-200 max-w-2xl leading-relaxed">
                  {h.hero_description}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {h.show_primary_button !== false && (
                  <Link
                    to={h.primary_button_destination || '/menu'}
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-display font-extrabold text-base bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-xl shadow-[#F6C928]/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <Utensils className="w-5 h-5" />
                    <span>{h.primary_button_label || 'Explore Our Menu'}</span>
                  </Link>
                )}

                {h.show_secondary_button !== false && (
                  <Link
                    to={h.secondary_button_destination || '/location'}
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-display font-bold text-base bg-[#171B20] hover:bg-white/10 text-white border border-white/20 hover:border-[#F6C928] transition-all"
                  >
                    <MapPin className="w-5 h-5 text-[#F6C928]" />
                    <span>{h.secondary_button_label || 'Find Our Location'}</span>
                  </Link>
                )}
              </div>

              {/* Quick Category Pills */}
              <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-[#FFF1C6]/80">
                <span className="font-bold text-[#F6C928] uppercase tracking-wider mr-1">
                  Popular Categories:
                </span>
                {['Rice Meals', 'Short Orders', 'Burgers and Snacks', 'Soda Pop', 'Snack Time', 'Kape-Malig'].map(
                  (cat) => (
                    <Link
                      key={cat}
                      to={`/menu?category=${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#F6C928] hover:text-[#101C28] border border-white/10 transition-colors font-medium"
                    >
                      {cat}
                    </Link>
                  )
                )}
              </div>
            </motion.div>

            {/* Hero Featured Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl bg-gradient-to-br from-[#F6C928]/25 via-[#171B20] to-[#23C7DF]/20 p-2 sm:p-3 border border-[#F6C928]/40 shadow-2xl">
                {h.hero_featured_image_url ? (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#101C28]">
                    <img
                      src={h.hero_featured_image_url}
                      alt={h.hero_title || 'Kamalig Food House Featured Dish'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#171B20] via-[#101C28] to-[#1e2f42] p-6 sm:p-8 flex flex-col justify-between relative">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#F6C928] text-[#101C28]">
                        Official Digital Menu
                      </span>
                      <span className="text-xs font-bold text-[#23C7DF]">Lucena City</span>
                    </div>

                    <div className="my-auto py-4 text-center space-y-3">
                      <img
                        src="/kamalig-logo.png"
                        alt="Kamalig Food House Official Logo"
                        className="w-28 h-28 mx-auto rounded-full border-2 border-[#F6C928] shadow-2xl object-cover"
                      />
                      <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                        KAMALIG <span className="text-[#F6C928]">FOOD HOUSE</span>
                      </h2>
                      <p className="text-sm font-bold text-[#FFF1C6]">
                        “Good Food, Great Mood! • Sarap na Abot-Kaya!”
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
                      <div className="p-2 rounded-xl bg-white/5">
                        <p className="font-display font-black text-base text-[#F6C928]">Silog & Rice</p>
                        <p className="text-[11px] text-gray-300">From ₱35</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <p className="font-display font-black text-base text-[#23C7DF]">Refreshers</p>
                        <p className="text-[11px] text-gray-300">Soda & Yakult</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <p className="font-display font-black text-base text-[#F28A32]">Kape-Malig</p>
                        <p className="text-[11px] text-gray-300">Iced Coffee</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  };

  const renderFeatured = () => {
    if (h.show_featured_section === false || featuredProducts.length === 0) return null;
    return (
      <section key="featured" className="py-16 sm:py-20 bg-[#101C28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#F6C928] mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Kamalig Highlights</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {h.featured_section_title || 'Featured Favorites'}
              </h2>
              {h.featured_section_subtitle && (
                <p className="text-gray-300 text-sm sm:text-base mt-1">
                  {h.featured_section_subtitle}
                </p>
              )}
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#F6C928] hover:text-[#FFD83D] transition-colors"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderBestSellers = () => {
    // Rule: Do not automatically claim products are best sellers without owner selection.
    if (h.show_best_sellers_section === false || bestSellers.length === 0) return null;
    return (
      <section key="best_sellers" className="py-16 sm:py-20 bg-[#171B20] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#F28A32] mb-2">
                <Award className="w-4 h-4" />
                <span>Owner Curated Picks</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {h.best_sellers_title || 'Crowd Best Sellers'}
              </h2>
              {h.best_sellers_subtitle && (
                <p className="text-gray-300 text-sm sm:text-base mt-1">
                  {h.best_sellers_subtitle}
                </p>
              )}
            </div>
            <Link
              to="/menu?filter=best-sellers"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#F6C928] hover:text-[#FFD83D] transition-colors"
            >
              <span>Browse All Menu Items</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderPromotions = () => {
    if (h.show_promo_section === false || promotions.length === 0) return null;
    return (
      <section key="promotions" className="py-12 sm:py-16 bg-[#101C28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#171B20] via-[#1c2838] to-[#171B20] border border-[#F6C928]/40 shadow-2xl p-8 sm:p-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  {promo.badge_text && (
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#F6C928] text-[#101C28]">
                      {promo.badge_text}
                    </span>
                  )}
                  <h2 className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
                    {promo.title}
                  </h2>
                  {promo.subtitle && (
                    <p className="text-lg font-bold text-[#F6C928]">{promo.subtitle}</p>
                  )}
                  {promo.description && (
                    <p className="text-gray-200 text-base max-w-2xl leading-relaxed">
                      {promo.description}
                    </p>
                  )}
                  {promo.button_label && (
                    <div className="pt-2">
                      <Link
                        to={promo.button_destination || '/menu'}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-extrabold text-sm bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg transition-all"
                      >
                        <span>{promo.button_label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>

                {promo.image_url ? (
                  <div className="lg:col-span-4">
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="w-full h-60 object-cover rounded-2xl border border-white/15 shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#101C28]/80 border border-white/10 text-center">
                    <Sparkles className="w-12 h-12 text-[#F6C928] mb-3" />
                    <p className="font-display font-black text-2xl text-[#FFF1C6]">
                      Sarap na Abot-Kaya!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Freshly cooked daily at Kamalig Food House
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderWhyChoose = () => {
    if (h.show_why_choose_section === false) return null;
    const items = (h.why_choose_items || []).filter((item) => item.is_visible !== false);
    if (items.length === 0) return null;

    return (
      <section key="why_choose" className="py-16 sm:py-20 bg-[#FFF1C6] text-[#101C28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-[#101C28] text-[#F6C928] mb-3">
              The Kamalig Difference
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101C28]">
              {h.why_choose_title || 'Why Choose Kamalig?'}
            </h2>
            {h.why_choose_subtitle && (
              <p className="text-[#171B20]/80 text-base mt-2">{h.why_choose_subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item, idx) => {
              const IconComp = ICON_MAP[item.icon] || Utensils;
              return (
                <div
                  key={item.id || idx}
                  className="rounded-3xl bg-white p-8 shadow-xl border border-[#101C28]/10 flex flex-col items-start justify-between hover:-translate-y-1 transition-transform"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#101C28] text-[#F6C928] flex items-center justify-center mb-6 shadow-md">
                      <IconComp className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-extrabold text-2xl text-[#101C28] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-[#171B20]/80 leading-relaxed text-sm sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderAboutPreview = () => {
    if (h.show_about_preview === false) return null;
    return (
      <section key="about_preview" className="py-16 sm:py-20 bg-[#171B20] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#101C28] border border-white/10 p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#23C7DF]">
                <Sparkles className="w-4 h-4" />
                <span>About Kamalig Food House</span>
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {h.about_preview_title || 'Experience Kamalig Food House'}
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {h.about_preview_description}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-bold text-sm bg-white/10 hover:bg-[#F6C928] text-white hover:text-[#101C28] transition-colors"
                >
                  <span>{h.about_preview_button_label || 'Read Our Story'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-2xl bg-[#171B20] border border-[#F6C928]/25 text-center space-y-3">
              <KamaligLogo size="lg" />
              <p className="font-display font-extrabold text-xl text-[#F6C928] pt-2">
                “Good Food, Great Mood!”
              </p>
              <p className="text-sm text-[#FFF1C6]">“Sarap na Abot-Kaya!”</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderLocationPreview = () => {
    if (h.show_location_preview === false) return null;
    const address =
      location?.address || '130 CCF Village, Brgy. Mayao Parada, Lucena City';
    return (
      <section key="location_preview" className="py-16 sm:py-20 bg-[#101C28] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#F6C928]">
                <MapPin className="w-4 h-4" />
                <span>Find Us in Lucena City</span>
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {h.location_preview_title || 'Visit Us in Lucena City'}
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                {h.location_preview_subtitle ||
                  'Drop by our physical store and enjoy freshly cooked meals and cold drinks.'}
              </p>

              <div className="p-5 rounded-2xl bg-[#171B20] border border-white/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#F6C928]">
                  Official Address
                </p>
                <p className="text-base font-semibold text-white">{address}</p>
                {location?.nearby_landmarks && (
                  <p className="text-xs text-gray-400">
                    Landmarks: {location.nearby_landmarks}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to="/location"
                  className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl font-display font-extrabold text-sm bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{h.location_preview_button_label || 'Get Directions'}</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <InteractiveKamaligMap
                latitude={location?.latitude || 13.9412}
                longitude={location?.longitude || 121.6445}
                zoom={location?.map_zoom || 16}
                businessName={location?.business_name || 'Kamalig Food House'}
                address={address}
                heightClass="h-[360px]"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  const sectionRenderers = {
    hero: renderHero,
    featured: renderFeatured,
    best_sellers: renderBestSellers,
    promotions: renderPromotions,
    why_choose: renderWhyChoose,
    about_preview: renderAboutPreview,
    location_preview: renderLocationPreview,
  };

  return (
    <div>
      {sectionOrder.map((sectionKey) => {
        const renderFn = sectionRenderers[sectionKey];
        return renderFn ? renderFn() : null;
      })}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

