import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  FolderKanban,
  Sparkles,
  EyeOff,
  Megaphone,
  Clock,
  ArrowRight,
  Award,
  Home,
  Info,
  MapPin,
  Phone,
  Settings,
  AlertTriangle,
  History,
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    adminApi
      .getDashboard()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
      </div>
    );
  }

  const s = stats || {};
  const draftSections = s.draft_sections || [];
  const auditLogs = s.recent_audit_logs || [];

  const metricCards = [
    {
      label: 'Published Products',
      value: s.total_published_products ?? 0,
      sub: `${s.products_with_photos ?? 0} with uploaded photos`,
      icon: Utensils,
      color: 'text-[#F6C928]',
      link: '/admin/products',
    },
    {
      label: 'Menu Categories',
      value: s.total_categories ?? 0,
      sub: `${s.published_categories ?? 0} visible on menu`,
      icon: FolderKanban,
      color: 'text-[#23C7DF]',
      link: '/admin/categories',
    },
    {
      label: 'Featured Products',
      value: s.featured_products ?? 0,
      sub: 'Shown on homepage highlights',
      icon: Sparkles,
      color: 'text-[#FFD83D]',
      link: '/admin/products',
    },
    {
      label: 'Best Sellers Selected',
      value: s.best_seller_products ?? 0,
      sub: 'Curated by owner',
      icon: Award,
      color: 'text-[#F28A32]',
      link: '/admin/products',
    },
    {
      label: 'Sold Out Today (1-Day)',
      value: s.sold_out_today_products ?? 0,
      sub: 'Auto-resets to Available tomorrow',
      icon: Clock,
      color: 'text-red-400',
      link: '/admin/products',
    },
    {
      label: 'Promotional Banners',
      value: s.promotional_banners ?? 0,
      sub: `${s.total_promotional_banners ?? 0} total configured`,
      icon: Megaphone,
      color: 'text-[#F06BA6]',
      link: '/admin/promotions',
    },
  ];

  const quickLinks = [
    {
      title: 'Manage Menu & Photos',
      desc: 'Add products, upload or replace food photographs, edit prices, and set Featured or Best Sellers.',
      path: '/admin/products',
      icon: Utensils,
    },
    {
      title: 'Edit Home Page',
      desc: 'Customize Hero headline, subtitle, buttons, Why Choose Kamalig, and section visibility.',
      path: '/admin/homepage',
      icon: Home,
    },
    {
      title: 'Edit About Us',
      desc: 'Add your business story, mission, vision, and upload store photographs.',
      path: '/admin/about',
      icon: Info,
    },
    {
      title: 'Location & Map Pin',
      desc: 'Adjust exact map coordinates, address, landmarks, and directions guide.',
      path: '/admin/location',
      icon: MapPin,
    },
    {
      title: 'Contact & Social Channels',
      desc: 'Configure phone number, Facebook page, Messenger link, email, and operating hours.',
      path: '/admin/contact',
      icon: Phone,
    },
    {
      title: 'Global Website Settings',
      desc: 'Manage logo, browser SEO title, brand colors, and footer copyright text.',
      path: '/admin/settings',
      icon: Settings,
    },
    {
      title: 'Account, Password & Admins',
      desc: 'Change your password, update the 4-digit access code (1830), and manage admin accounts.',
      path: '/admin/account',
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F6C928]">
            Kamalig Food House • Owner CMS
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Website Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Control all public content, menu items, photographs, and location details from one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-gray-300 bg-[#101C28] px-4 py-3 rounded-2xl border border-white/10">
          <Clock className="w-4 h-4 text-[#F6C928]" />
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-bold">Last Content Update</p>
            <p className="font-semibold text-white">
              {s.last_content_update
                ? new Date(s.last_content_update).toLocaleString()
                : 'Just now'}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Unpublished Drafts Alert */}
      {draftSections.length > 0 && (
        <div className="rounded-2xl bg-[#23C7DF]/15 border border-[#23C7DF]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#23C7DF] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">
                You have saved drafts waiting to be published
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Sections with unpublished drafts:{' '}
                {draftSections.map((d) => d.name).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {draftSections.map((d) => (
              <Link
                key={d.path}
                to={d.path}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#23C7DF] text-[#101C28]"
              >
                Review {d.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Key Promotional Website Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="rounded-2xl bg-[#171B20] border border-white/10 hover:border-[#F6C928]/50 p-6 flex items-start justify-between gap-4 transition-all group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <p className="font-display font-black text-3xl sm:text-4xl text-white mt-2">
                  {card.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`p-3.5 rounded-2xl bg-[#101C28] border border-white/10 ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Links to Manage Website Sections */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">
          Quick Website Section Editors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-2xl bg-[#171B20] border border-white/10 hover:border-[#F6C928] p-6 flex flex-col justify-between gap-4 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-[#F6C928] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F6C928]">
                  <span>Open Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Content Audit Log */}
      {auditLogs.length > 0 && (
        <div className="rounded-2xl bg-[#171B20] border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="w-4 h-4 text-[#F6C928]" />
            <h2>Recent Content Activity</h2>
          </div>
          <div className="divide-y divide-white/10 text-xs">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-[#F6C928]">{log.section}</span>
                  <span className="mx-2 text-white/30">•</span>
                  <span className="font-semibold text-white">{log.action}</span>
                  {log.summary && (
                    <span className="text-gray-400 ml-2">— {log.summary}</span>
                  )}
                </div>
                <span className="text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

