import React from 'react';
import { useSite } from '../../context/SiteContext';

export default function KamaligLogo({ size = 'md', showTagline = false, className = '' }) {
  const site = useSite();
  const settings = site?.settings;

  const sizeMap = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  const businessName = settings?.business_name || 'Kamalig Food House';
  const tagline = settings?.tagline || 'Good Food, Great Mood!';
  const logoSrc = settings?.logo_url || '/kamalig-logo.png';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src={logoSrc}
        alt={`${businessName} Logo`}
        className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover bg-[#101C28] border-2 border-[#F6C928]/70 shadow-lg`}
      />
      <div className="flex flex-col leading-tight">
        <span className="font-display font-extrabold tracking-tight text-white text-lg sm:text-xl">
          <span className="text-[#F6C928]">KAMALIG</span> FOOD HOUSE
        </span>
        {showTagline && (
          <span className="text-xs font-medium text-[#FFF1C6]/80 tracking-wide">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
