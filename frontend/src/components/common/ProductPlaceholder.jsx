import React from 'react';
import { Utensils, CupSoda, Coffee, Flame, Sparkles, Sandwich } from 'lucide-react';

export default function ProductPlaceholder({ product, className = '' }) {
  const categoryName = (product?.category_name || '').toLowerCase();

  let IconComponent = Utensils;
  let accentColor = '#F6C928';
  if (categoryName.includes('soda') || categoryName.includes('yakult') || categoryName.includes('snack time')) {
    IconComponent = CupSoda;
    accentColor = '#23C7DF';
  } else if (categoryName.includes('kape') || categoryName.includes('coffee')) {
    IconComponent = Coffee;
    accentColor = '#F28A32';
  } else if (categoryName.includes('burger') || categoryName.includes('combo')) {
    IconComponent = Sandwich;
    accentColor = '#FFD83D';
  } else if (categoryName.includes('short')) {
    IconComponent = Flame;
    accentColor = '#F06BA6';
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#171B20] via-[#101C28] to-[#1d2c3f] p-6 text-center select-none ${className}`}
    >
      {/* Subtle decorative radial glow */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundColor: '#F6C928' }}
      />

      {/* Branded Emblem Circle */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border shadow-inner transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: 'rgba(246, 201, 40, 0.1)',
          borderColor: 'rgba(246, 201, 40, 0.3)',
        }}
      >
        <IconComponent className="w-8 h-8 text-[#F6C928]" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-[#F6C928]/90 mb-1">
        {product?.category_name || 'Kamalig Kitchen'}
      </span>
      <p className="font-display font-bold text-white/90 text-sm line-clamp-2 max-w-[190px]">
        {product?.name || 'Kamalig Specialty'}
      </p>
      <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#FFF1C6]/60">
        <Sparkles className="w-3 h-3 text-[#F6C928]" />
        Good Food, Great Mood!
      </span>
    </div>
  );
}

