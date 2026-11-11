'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { sortCanonicalCategories } from '@/lib/canonical/catalog';

export interface CanonicalLibraryTabProps {
  dishes: any[];
  loading: boolean;
}

export function CanonicalLibraryTab({ dishes, loading }: CanonicalLibraryTabProps) {
  const [canonicalSearch, setCanonicalSearch] = useState('');
  const [canonicalCategoryFilter, setCanonicalCategoryFilter] = useState<string>('ALL');

  const canonicalCategories = useMemo(
    () =>
      sortCanonicalCategories(
        Array.from(new Set(dishes.map((d: any) => d.category).filter(Boolean))) as string[]
      ),
    [dishes]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dishes) {
      if (d?.category) {
        map.set(d.category, (map.get(d.category) ?? 0) + 1);
      }
    }
    return map;
  }, [dishes]);

  const filteredCanonical = useMemo(() => {
    const term = canonicalSearch.toLowerCase().trim();
    return dishes.filter((dish: any) => {
      const categoryVal = String(dish.category || 'Other');
      if (canonicalCategoryFilter !== 'ALL' && categoryVal !== canonicalCategoryFilter) {
        return false;
      }
      if (!term) return true;
      const nameMatch =
        dish.canonicalName?.toLowerCase().includes(term) ||
        dish.displayName?.toLowerCase().includes(term) ||
        dish.normalizedName?.toLowerCase().includes(term);
      const descMatch =
        dish.culinaryBackground?.toLowerCase().includes(term) ||
        dish.generalizedDescription?.toLowerCase().includes(term);
      const catMatch = dish.category?.toLowerCase().includes(term);
      const cuisineMatch =
        dish.cuisineRegion?.toLowerCase().includes(term) ||
        dish.cuisine?.toLowerCase().includes(term);
      const aliasMatch =
        Array.isArray(dish.aliases) &&
        dish.aliases.some((a: string) => String(a).toLowerCase().includes(term));
      return Boolean(nameMatch || descMatch || catMatch || cuisineMatch || aliasMatch);
    });
  }, [dishes, canonicalSearch, canonicalCategoryFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-cream-50">
              Curated Canonical Dish Gallery ({filteredCanonical.length} of {dishes.length})
            </h3>
            <p className="text-xs text-taupe-400">Shared 3D-clay culinary assets reused across restaurants without cross-tenant contamination</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search canonical dishes..."
              value={canonicalSearch}
              onChange={(e) => setCanonicalSearch(e.target.value)}
              style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
            />
          </div>
        </div>

        {canonicalCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCanonicalCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                canonicalCategoryFilter === 'ALL'
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'bg-[#1A120D] text-taupe-400 border border-espresso-800 hover:text-cream-100'
              }`}
            >
              All ({dishes.length})
            </button>
            {canonicalCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCanonicalCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  canonicalCategoryFilter === cat
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-[#1A120D] text-taupe-400 border border-espresso-800 hover:text-cream-100'
                }`}
              >
                {cat} ({categoryCounts.get(cat) ?? 0})
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Canonical Dish</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Cuisine / Region</th>
                <th className="py-3 px-4 font-semibold">Aliases</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-800/60">
              {filteredCanonical.map((dish: any) => {
                const title = dish.canonicalName || dish.displayName || dish.normalizedName;
                const desc = dish.culinaryBackground || dish.generalizedDescription || '';
                return (
                  <tr key={dish.id} className="hover:bg-espresso-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {dish.imageAsset?.publicUrl ? (
                          <img
                            src={dish.imageAsset.publicUrl}
                            alt={title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-espresso-800 ring-1 ring-white/10"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#1F1713] border border-espresso-700 flex items-center justify-center text-[10px] text-taupe-400 shrink-0 font-mono">
                            3D
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-cream-50 text-sm">{title}</div>
                          <div className="text-taupe-400 text-[11px] line-clamp-1 max-w-md">{desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-taupe-300 font-medium">{dish.category || 'Curated'}</td>
                    <td className="py-3.5 px-4 text-cream-200">
                      <span className="px-2 py-0.5 rounded-full bg-espresso-800/80 text-[10px] font-medium border border-espresso-700/60">
                        {dish.cuisineRegion || dish.cuisine || 'Global'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-taupe-400 font-mono text-[11px] max-w-xs">
                      <span className="line-clamp-2">
                        {Array.isArray(dish.aliases) ? dish.aliases.join(', ') : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800/70 text-emerald-300">
                        {dish.reviewState === 'APPROVED' || !dish.reviewState ? 'VERIFIED' : dish.reviewState}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredCanonical.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-taupe-400">
                    {dishes.length === 0 && loading
                      ? 'Loading canonical dish library...'
                      : 'No canonical dishes match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

