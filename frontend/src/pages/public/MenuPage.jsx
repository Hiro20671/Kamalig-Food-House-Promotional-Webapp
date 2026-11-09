import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Award, Utensils, X, Filter, CheckCircle2 } from 'lucide-react';
import { publicApi } from '../../services/api';
import ProductCard from '../../components/common/ProductCard';
import ProductDetailModal from '../../components/common/ProductDetailModal';

export default function MenuPage() {
  const { productSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [specialFilter, setSpecialFilter] = useState(searchParams.get('filter') || 'all'); // 'all' | 'featured' | 'best-sellers'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([publicApi.getCategories(), publicApi.getProducts()])
      .then(([catsData, prodsData]) => {
        if (!mounted) return;
        setCategories(catsData || []);
        setProducts(prodsData || []);
      })
      .catch((err) => console.error('Menu load error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync URL query params
  useEffect(() => {
    const catParam = searchParams.get('category');
    const filterParam = searchParams.get('filter');
    if (catParam) setActiveCategory(catParam);
    if (filterParam) setSpecialFilter(filterParam);
  }, [searchParams]);

  // If navigated directly to /menu/:productSlug, open that product modal automatically
  useEffect(() => {
    if (!productSlug || products.length === 0) return;
    const found = products.find(
      (p) => p.slug === productSlug || String(p.id) === String(productSlug)
    );
    if (found) {
      setSelectedProduct(found);
    }
  }, [productSlug, products]);

  const handleCloseModal = () => {
    setSelectedProduct(null);
    if (productSlug) {
      navigate('/menu', { replace: true });
    }
  };

  const hasBestSellers = useMemo(
    () => products.some((p) => p.is_best_seller),
    [products]
  );

  const availableTodayCount = useMemo(
    () => products.filter((p) => !p.is_sold_out_today).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'all' && p.category_slug !== activeCategory && String(p.category) !== activeCategory) {
        return false;
      }
      if (specialFilter === 'available' && p.is_sold_out_today) {
        return false;
      }
      if (specialFilter === 'featured' && !p.is_featured) {
        return false;
      }
      if (specialFilter === 'best-sellers' && !p.is_best_seller) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.category_name || '').toLowerCase().includes(q);
        const variantMatch = (p.variants || []).some((v) =>
          (v.variant_name || '').toLowerCase().includes(q)
        );
        return nameMatch || descMatch || catMatch || variantMatch;
      }
      return true;
    });
  }, [products, activeCategory, specialFilter, searchQuery]);

  // Group filtered products by category when viewing 'all'
  const groupedByCategory = useMemo(() => {
    if (activeCategory !== 'all') {
      const currentCat = categories.find(
        (c) => c.slug === activeCategory || String(c.id) === activeCategory
      );
      return [
        {
          category: currentCat || { name: 'Selected Category', slug: activeCategory },
          items: filteredProducts,
        },
      ];
    }

    const groups = [];
    categories.forEach((cat) => {
      const catItems = filteredProducts.filter((p) => p.category === cat.id);
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    });
    return groups;
  }, [categories, filteredProducts, activeCategory]);

  return (
    <div className="bg-[#101C28] min-h-screen pb-20">
      {/* Menu Page Banner */}
      <section className="bg-gradient-to-b from-[#171B20] to-[#101C28] border-b border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6C928]/15 border border-[#F6C928]/35 text-[#F6C928] text-xs font-extrabold uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5" />
              <span>Official Digital Menu</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white">
              Our Menu &amp; <span className="text-[#F6C928]">Products</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Good Food, Great Mood! Browse our freshly cooked Rice Meals, Short Orders, Combo Snacks, Burgers, Soda Pop, Yakult Mix, Snack Time, and Kape-Malig coffee — Sarap na Abot-Kaya!
            </p>
          </div>

          {/* Search & Highlight Filters Bar */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-6 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meals, drinks, flavors (e.g., Sisigilog, Chami, Strawberry, Mocha)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#101C28] border border-white/15 focus:border-[#F6C928] text-white placeholder-gray-400 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="lg:col-span-6 flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => setSpecialFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  specialFilter === 'all'
                    ? 'bg-[#F6C928] text-[#101C28]'
                    : 'bg-[#171B20] text-gray-300 border border-white/10 hover:border-[#F6C928]/50'
                }`}
              >
                All Items ({products.length})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSpecialFilter((prev) => (prev === 'available' ? 'all' : 'available'))
                }
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  specialFilter === 'available'
                    ? 'bg-emerald-400 text-[#101C28]'
                    : 'bg-[#171B20] text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Available Today ({availableTodayCount})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSpecialFilter((prev) => (prev === 'featured' ? 'all' : 'featured'))
                }
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  specialFilter === 'featured'
                    ? 'bg-[#F6C928] text-[#101C28]'
                    : 'bg-[#171B20] text-[#F6C928] border border-[#F6C928]/30 hover:bg-[#F6C928]/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Featured
              </button>
              {hasBestSellers && (
                <button
                  type="button"
                  onClick={() =>
                    setSpecialFilter((prev) =>
                      prev === 'best-sellers' ? 'all' : 'best-sellers'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    specialFilter === 'best-sellers'
                      ? 'bg-[#F28A32] text-[#101C28]'
                      : 'bg-[#171B20] text-[#F28A32] border border-[#F28A32]/30 hover:bg-[#F28A32]/10'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Best Sellers
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Category Navigation */}
      <div className="sticky top-[68px] z-30 bg-[#101C28]/95 backdrop-blur-md border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-[#F6C928] flex-shrink-0 mr-1" />
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSearchParams({});
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#F6C928] text-[#101C28] shadow-md'
                : 'bg-[#171B20] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.slug);
                setSearchParams({ category: cat.slug });
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.slug
                  ? 'bg-[#F6C928] text-[#101C28] shadow-md'
                  : 'bg-[#171B20] text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              {cat.name}
              {cat.published_product_count > 0 && (
                <span className="ml-1.5 opacity-70 text-xs">
                  ({cat.published_product_count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Catalog Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
            <p className="text-sm text-[#FFF1C6]">Loading digital menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-[#171B20] border border-white/10 p-12 text-center max-w-lg mx-auto my-8 space-y-4">
            <Utensils className="w-12 h-12 text-[#F6C928] mx-auto" />
            <h3 className="font-display font-bold text-2xl text-white">
              No matching menu items found
            </h3>
            <p className="text-sm text-gray-400">
              Try clearing your search or selecting &ldquo;All Categories&rdquo; to browse our full menu.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSpecialFilter('all');
                setSearchQuery('');
                setSearchParams({});
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#F6C928] text-[#101C28] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {groupedByCategory.map(({ category, items }) => (
              <section key={category.id || category.slug} className="space-y-6">
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[#F6C928]">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-sm text-gray-300 mt-1">{category.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(prod) => setSelectedProduct(prod)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={handleCloseModal}
      />
    </div>
  );
}

