import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Award, MapPin, Tag, CheckCircle2, ExternalLink } from 'lucide-react';
import ProductPlaceholder from './ProductPlaceholder';
import { formatProductPrice } from './ProductCard';

export default function ProductDetailModal({ product, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.main_image_url || null);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const allImages = [
    ...(product.main_image_url ? [{ id: 'main', image_url: product.main_image_url, alt_text: product.name }] : []),
    ...(product.images || []),
  ];

  // Group variants by variant_group (Size, Flavor, Topping, Option)
  const groupedVariants = (product.variants || []).reduce((acc, v) => {
    const group = v.variant_group || 'Option';
    if (!acc[group]) acc[group] = [];
    acc[group].push(v);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#171B20] border border-[#F6C928]/30 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close product modal"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#101C28]/90 border border-white/15 flex items-center justify-center text-white hover:bg-[#F6C928] hover:text-[#101C28] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Image & Gallery */}
          <div className="bg-[#101C28] p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
            <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-[#171B20]">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ProductPlaceholder product={product} />
              )}
            </div>

            {allImages.length > 1 && (
              <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
                {allImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      selectedImage === img.image_url
                        ? 'border-[#F6C928] scale-105'
                        : 'border-white/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Complete Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#101C28] text-[#FFF1C6] border border-white/15">
                  <Tag className="w-3.5 h-3.5 text-[#F6C928]" />
                  {product.category_name}
                </span>
                {product.is_sold_out_today ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white border border-red-400">
                    Sold Out Today • Available Tomorrow
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Available Today
                  </span>
                )}
                {product.is_best_seller && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#F28A32] text-[#101C28]">
                    <Award className="w-3.5 h-3.5" />
                    Best Seller
                  </span>
                )}
                {product.is_featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#F6C928] text-[#101C28]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured
                  </span>
                )}
              </div>

              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                {product.name}
              </h2>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-display font-black text-3xl text-[#F6C928]">
                  {formatProductPrice(product)}
                </span>
                {product.price_note && product.price !== null && (
                  <span className="text-xs font-semibold text-[#FFF1C6]/80 bg-white/5 px-2.5 py-1 rounded-lg">
                    {product.price_note}
                  </span>
                )}
              </div>

              <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-6">
                {product.description || 'Prepared fresh daily at Kamalig Food House in Lucena City.'}
              </p>

              {/* Variations (Sizes, Flavors, Toppings) */}
              {Object.keys(groupedVariants).length > 0 && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  {Object.entries(groupedVariants).map(([groupName, items]) => (
                    <div key={groupName}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#F6C928] mb-2">
                        Available {groupName === 'Option' ? 'Variations' : `${groupName}s`}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {items.map((v) => (
                          <div
                            key={v.id || v.variant_name}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                              v.is_available
                                ? 'bg-[#101C28] border-white/15 text-white'
                                : 'bg-white/5 border-white/5 text-gray-500 line-through'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F6C928]" />
                            <span>{v.variant_name}</span>
                            {v.price !== null && v.price !== undefined && v.price !== '' && (
                              <span className="text-[#F6C928] font-bold ml-1">
                                ₱{Number(v.price) % 1 === 0 ? Number(v.price).toFixed(0) : Number(v.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promotional Footer Actions (No Online Ordering per requirements) */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to="/location"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] transition-colors shadow-lg"
              >
                <MapPin className="w-4 h-4" />
                Visit Us to Enjoy This
              </Link>
              <Link
                to={`/menu/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-xs text-[#FFF1C6] hover:text-[#F6C928] bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Product Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

