import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Facebook,
  MessageCircle,
  Clock,
  Lock,
  Sparkles,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import KamaligLogo from '../common/KamaligLogo';
import PwaInstallButton from '../common/PwaInstallButton';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Menu / Products', path: '/menu' },
  { label: 'Location', path: '/location' },
  { label: 'Contact Us', path: '/contact' },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings, contact, location } = useSite();
  const { isAuthenticated } = useAuth();
  const routerLocation = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routerLocation.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const businessName = settings?.business_name || 'Kamalig Food House';
  const tagline = settings?.tagline || 'Good Food, Great Mood!';
  const supportingTagline = settings?.supporting_tagline || 'Sarap na Abot-Kaya!';
  const displayAddress =
    location?.address ||
    contact?.address ||
    '130 CCF Village, Brgy. Mayao Parada, Lucena City';

  return (
    <div className="min-h-screen flex flex-col bg-[#101C28] text-white">
      {/* Top Announcement Bar */}
      <div className="bg-[#171B20] border-b border-white/10 py-2 px-4 text-xs text-[#FFF1C6]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#F6C928] flex-shrink-0" />
            <span className="truncate">{tagline}</span>
            <span className="text-white/30">•</span>
            <span className="text-[#F6C928] font-bold">{supportingTagline}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-gray-300">
            <Link
              to="/location"
              className="inline-flex items-center gap-1.5 hover:text-[#F6C928] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F6C928]" />
              <span>{displayAddress}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#101C28]/95 backdrop-blur-md shadow-xl border-b border-[#F6C928]/20 py-2.5 sm:py-3'
            : 'bg-[#101C28]/85 backdrop-blur-sm border-b border-white/10 py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/" aria-label="Kamalig Food House Home" className="min-w-0">
            <KamaligLogo size="sm" showTagline />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-[#F6C928] text-[#101C28] font-bold shadow-md'
                      : 'text-gray-200 hover:text-[#F6C928] hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions: Install App + Get Directions + Owner Login */}
          <div className="hidden sm:flex items-center gap-2">
            <PwaInstallButton variant="compact" />

            <Link
              to="/location"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-md transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </Link>

            <Link
              to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#171B20] hover:bg-white/10 text-[#FFF1C6] hover:text-[#F6C928] border border-[#F6C928]/35 transition-all"
              title="Owner Login (Requires 4-Digit Access Code)"
            >
              {isAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F6C928]" />
                  <span>Owner CMS</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#F6C928]" />
                  <span>Owner Login</span>
                </>
              )}
            </Link>
          </div>

          {/* Mobile Quick Actions + Hamburger Button */}
          <div className="flex lg:hidden items-center gap-1.5">
            <Link
              to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#171B20] border border-[#F6C928]/35 text-[11px] font-bold text-[#F6C928]"
              aria-label="Owner Login"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="p-2.5 rounded-xl bg-[#171B20] border border-white/15 text-[#F6C928] hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#171B20] border-b border-[#F6C928]/30 px-4 pt-3 pb-6 space-y-2 shadow-2xl">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl font-bold text-base transition-colors ${
                    isActive
                      ? 'bg-[#F6C928] text-[#101C28]'
                      : 'text-white hover:bg-white/5 hover:text-[#F6C928]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 gap-2.5">
              <Link
                to="/location"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-sm bg-[#F6C928] text-[#101C28]"
              >
                <Navigation className="w-4 h-4" />
                Get Directions to Kamalig
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-xs bg-[#101C28] text-[#FFF1C6] border border-[#F6C928]/35"
                >
                  <Lock className="w-3.5 h-3.5 text-[#F6C928]" />
                  <span>{isAuthenticated ? 'Owner CMS' : 'Owner Login'}</span>
                </Link>
                <PwaInstallButton className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-xs bg-[#23C7DF] text-[#101C28] cursor-pointer" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Route Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Dynamic Manageable Footer */}
      <footer className="bg-[#171B20] border-t border-white/10 text-gray-300 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Brand Column */}
            <div className="space-y-4">
              <KamaligLogo size="md" showTagline />
              <p className="text-xs font-bold uppercase tracking-wider text-[#F6C928]">
                {tagline} • {supportingTagline}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {settings?.footer_text ||
                  'Your neighborhood food house in Lucena City serving freshly cooked rice meals, short orders, burgers, snacks, and refreshing drinks.'}
              </p>
              <div className="pt-1">
                <PwaInstallButton variant="compact" />
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wider mb-4 text-[#F6C928]">
                Explore Kamalig
              </h3>
              <ul className="space-y-2.5 text-sm">
                {NAV_ITEMS.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-gray-300 hover:text-[#F6C928] transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Address & Operating Hours */}
            <div>
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wider mb-4 text-[#F6C928]">
                Our Location
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F6C928] flex-shrink-0 mt-1" />
                  <span>{displayAddress}</span>
                </div>
                {(location?.business_hours || contact?.operating_hours) && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#23C7DF] flex-shrink-0 mt-1" />
                    <span>{location?.business_hours || contact?.operating_hours}</span>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    to="/location"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F6C928] hover:text-[#FFD83D] underline underline-offset-4"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Open Interactive Map &amp; Directions
                  </Link>
                </div>
              </div>
            </div>

            {/* Connect / Contact */}
            <div>
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wider mb-4 text-[#F6C928]">
                Connect With Us
              </h3>
              <div className="space-y-3 text-sm">
                {contact?.show_phone && contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2.5 text-gray-300 hover:text-[#F6C928] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#F6C928]" />
                    <span>{contact.phone}</span>
                  </a>
                )}
                {contact?.show_email && contact?.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2.5 text-gray-300 hover:text-[#F6C928] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#F6C928]" />
                    <span>{contact.email}</span>
                  </a>
                )}
                {contact?.show_facebook && contact?.facebook_url && (
                  <a
                    href={contact.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-gray-300 hover:text-[#23C7DF] transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-[#23C7DF]" />
                    <span>{contact.facebook_page_name || 'Official Facebook Page'}</span>
                  </a>
                )}
                {contact?.show_messenger && contact?.messenger_url && (
                  <a
                    href={contact.messenger_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-gray-300 hover:text-[#23C7DF] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#23C7DF]" />
                    <span>Message us on Messenger</span>
                  </a>
                )}
                {!contact?.phone && !contact?.email && !contact?.facebook_url && (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Visit us directly at {displayAddress} or check our Contact page for updates.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Owner Login Button */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>
              {settings?.copyright_text ||
                `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span>Promotional Digital Storefront</span>
              <Link
                to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101C28] border border-white/10 text-[#FFF1C6] hover:text-[#F6C928] hover:border-[#F6C928]/40 transition-colors font-semibold"
              >
                <Lock className="w-3.5 h-3.5 text-[#F6C928]" />
                <span>{isAuthenticated ? 'Owner Dashboard' : 'Owner Login'}</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
