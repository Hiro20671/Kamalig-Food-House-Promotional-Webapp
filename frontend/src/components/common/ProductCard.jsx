import React from 'react';
import { Sparkles, Award, Eye, Clock } from 'lucide-react';
import ProductPlaceholder from './ProductPlaceholder';

export function formatProductPrice(product) {
  if (product.price !== null && product.price !== undefined && product.price !== '') {
    const num = Number(product.price);
    if (!Number.isNaN(num)) {
      return `₱${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
    }
  }
  if (product.price_note) {
    return product.price_note;
  }
  const pricedVariant = (product.variants || []).find(
    (v) => v.price !== null && v.price !== undefined && v.price !== ''
  );
  if (pricedVariant) {
    const vNum = Number(pricedVariant.price);
    return `From ₱${vNum % 1 === 0 ? vNum.toFixed(0) : vNum.toFixed(2)}`;
  }
  return 'Ask in-store';
}

export default function ProductCard({ product, onSelect }) {
  const displayPrice = formatProductPrice(product);
  const variantCount = (product.variants || []).length;
  const isSoldOutToday = Boolean(product.is_sold_out_today);

  return (
    <div
      onClick={() => onSelect && onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(product);
        }
      }}
      className={`group relative flex flex-col rounded-2xl bg-[#171B20] border overflow-hidden shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F6C928] ${
        isSoldOutToday
          ? 'border-red-500/40 opacity-85 hover:opacity-100'
          : 'border-white/10 hover:border-[#F6C928]/60 hover:shadow-2xl hover:shadow-[#F6C928]/10'
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#101C28]">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover object-center transition-transform duration-500 ${
              isSoldOutToday ? 'grayscale-[45%]' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <ProductPlaceholder product={product} />
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#101C28]/85 text-[#FFF1C6] backdrop-blur-md border border-white/15">
            {product.category_name}
          </span>
        </div>

        {/* Sold Out Today / Featured / Best Seller Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {isSoldOutToday && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-600 text-white shadow-lg border border-red-400">
              <Clock className="w-3.5 h-3.5" />
              Sold Out Today
            </span>
          )}
          {product.is_best_seller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#F28A32] text-[#101C28] shadow-md">
              <Award className="w-3.5 h-3.5" />
              Best Seller
            </span>
          )}
          {product.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#F6C928] text-[#101C28] shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Featured
            </span>
          )}
        </div>

        {/* Hover Overlay Prompt */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101C28] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F6C928] text-[#101C28] shadow-md">
            <Eye className="w-3.5 h-3.5" />
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-bold text-lg text-white group-hover:text-[#F6C928] transition-colors leading-snug">
              {product.name}
            </h3>
          </div>
          {product.description ? (
            <p className="text-sm text-gray-300/85 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400/70 italic">
              Freshly prepared at Kamalig Food House.
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            <span
              className={`font-display font-extrabold text-xl ${
                isSoldOutToday ? 'text-gray-400 line-through' : 'text-[#F6C928]'
              }`}
            >
              {displayPrice}
            </span>
            {product.price_note && product.price !== null && (
              <p className="text-[11px] text-[#FFF1C6]/75 mt-0.5">{product.price_note}</p>
            )}
          </div>

          {isSoldOutToday ? (
            <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/35 text-[11px] font-bold text-red-300">
              Back Tomorrow
            </span>
          ) : variantCount > 0 ? (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-[#23C7DF]">
              {variantCount} {variantCount === 1 ? 'Option' : 'Options'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

