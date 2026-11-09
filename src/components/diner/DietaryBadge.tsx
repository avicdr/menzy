import React from 'react';
import { Sparkles, Flame, Leaf, Wheat, Milk, ShieldAlert } from 'lucide-react';

interface DietaryBadgeProps {
  label: string;
  showIconOnly?: boolean;
}

/**
 * Authentic FSSAI-compliant Indian Food Type Marker
 * Green dot in square = Veg
 * Brown triangle in square = Non-Veg
 * Yellow dot in square = Contains Egg
 */
export function FssaiMarker({ type, size = 'sm' }: { type: 'VEG' | 'NON_VEG' | 'EGG'; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const innerDot = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  if (type === 'VEG') {
    return (
      <span
        title="Vegetarian (Pure Veg)"
        className={`inline-flex items-center justify-center ${dim} border border-green-700 bg-white rounded-[3px] shrink-0 p-[2px]`}
      >
        <span className={`${innerDot} rounded-full bg-green-700`} />
      </span>
    );
  }

  if (type === 'NON_VEG') {
    return (
      <span
        title="Non-Vegetarian"
        className={`inline-flex items-center justify-center ${dim} border border-[#7B3F00] bg-white rounded-[3px] shrink-0 p-[2px]`}
      >
        <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6.5px] border-b-[#7B3F00]" />
      </span>
    );
  }

  // EGG
  return (
    <span
      title="Contains Egg"
      className={`inline-flex items-center justify-center ${dim} border border-amber-500 bg-white rounded-[3px] shrink-0 p-[2px]`}
    >
      <span className={`${innerDot} rounded-full bg-amber-500`} />
    </span>
  );
}

export function DietaryBadge({ label, showIconOnly = false }: DietaryBadgeProps) {
  const norm = label.toUpperCase().trim().replace(/\s+/g, '_');

  // 1. Indian Food Classification (FSSAI)
  if (norm === 'VEG' || norm === 'VEGETARIAN' || norm === 'PURE_VEG') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 shadow-2xs">
        <FssaiMarker type="VEG" />
        {!showIconOnly && <span>Veg</span>}
      </span>
    );
  }

  if (norm === 'NON_VEG' || norm === 'NON-VEG' || norm === 'NONVEG') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#7B3F00] border border-amber-200 shadow-2xs">
        <FssaiMarker type="NON_VEG" />
        {!showIconOnly && <span>Non-Veg</span>}
      </span>
    );
  }

  if (norm === 'EGG' || norm === 'CONTAINS_EGG' || norm === 'EGGETARIAN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-amber-900 border border-yellow-300 shadow-2xs">
        <FssaiMarker type="EGG" />
        {!showIconOnly && <span>Contains Egg</span>}
      </span>
    );
  }

  if (norm === 'JAIN' || norm === 'JAIN_FRIENDLY') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        <span>Jain Safe</span>
      </span>
    );
  }

  // 2. Western / International Classification
  if (norm === 'VEGAN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Leaf className="w-3 h-3 text-emerald-600" />
        <span>Vegan</span>
      </span>
    );
  }

  if (norm === 'GLUTEN_FREE' || norm === 'GF') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
        <Wheat className="w-3 h-3 text-amber-600" />
        <span>Gluten-Free</span>
      </span>
    );
  }

  if (norm === 'DAIRY_FREE' || norm === 'DF') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
        <Milk className="w-3 h-3 text-sky-600" />
        <span>Dairy-Free</span>
      </span>
    );
  }

  if (norm === 'NUT_FREE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
        <span>Nut-Free</span>
      </span>
    );
  }

  if (norm === 'HALAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
        <span>Halal</span>
      </span>
    );
  }

  if (norm === 'KOSHER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <span>Kosher</span>
      </span>
    );
  }

  // 3. Popular & Chef Pick
  if (norm === 'POPULAR' || norm === 'BESTSELLER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
        <Flame className="w-3 h-3 text-rose-600" />
        <span>Bestseller</span>
      </span>
    );
  }

  if (norm.includes('CHEF') || norm.includes('RECOMMENDED')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-800 border border-terracotta-200 shadow-2xs">
        <Sparkles className="w-3 h-3 text-terracotta-600" />
        <span>Chef Pick</span>
      </span>
    );
  }

  // Generic fallback
  const display = label.replace(/_/g, ' ').toLowerCase();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-cream-200 text-espresso-700 border-cream-300">
      <span className="w-1.5 h-1.5 rounded-full bg-espresso-600" />
      <span className="capitalize">{display}</span>
    </span>
  );
}
