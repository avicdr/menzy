'use client';

import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Check, Building2, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface GooglePlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  initialQuery: string;
  onSelectReviewUrl: (url: string) => void;
}

export function GooglePlacesModal({
  isOpen,
  onClose,
  restaurantId,
  initialQuery,
  onSelectReviewUrl,
}: GooglePlacesModalProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    try {
      setSearching(true);
      setError(null);
      const res = await fetch(
        `/api/restaurants/${restaurantId}/places-search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search places');
      setResults(data.places || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Error searching Google Maps listings');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (place: any) => {
    const finalUrl = place.reviewUrl || place.mapsUrl;
    onSelectReviewUrl(finalUrl);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find Your Google Business Listing"
      subtitle="Search your cafe or restaurant on Google Maps to generate your direct review link."
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
      className="font-sans"
      bodyClassName="space-y-3"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-cream-300 bg-white text-xs font-semibold text-espresso-800 hover:bg-cream-100 transition-colors"
        >
          Close
        </button>
      }
    >
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-taupe-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Soil to Soul Kitchen Lucknow or your cafe name..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="text-[11px] text-taupe-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" />
          <span>Tip: Enter your restaurant name and city for the most accurate match.</span>
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-2.5 pt-1">
        {results.length > 0 ? (
          results.map((place) => (
            <div
              key={place.id}
              className="p-3.5 rounded-2xl border border-cream-200 bg-cream-50/50 hover:bg-white hover:border-cream-300 transition-all flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm text-espresso-900 truncate">
                  {place.name}
                </div>
                <div className="text-[11px] text-taupe-500 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-taupe-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{place.address}</span>
                </div>
                <div className="pt-1">
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta hover:underline"
                  >
                    <span>Preview listing on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="px-3 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-xs whitespace-nowrap shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Use Link</span>
              </button>
            </div>
          ))
        ) : searched && !searching ? (
          <div className="py-12 text-center text-xs text-taupe-500 space-y-2">
            <p>No exact listing found for "{query}".</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-terracotta font-semibold hover:underline"
            >
              <span>Search directly on Google Maps & copy your Place URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-taupe-400">
            Type your restaurant name above and click search.
          </div>
        )}
      </div>
    </Modal>
  );
}
