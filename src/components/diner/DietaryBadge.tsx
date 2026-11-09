import React from 'react';

interface DietaryBadgeProps {
  label: string;
}

export function DietaryBadge({ label }: DietaryBadgeProps) {
  const normalized = label.toUpperCase();

  let bg = 'bg-cream-200 text-espresso-700 border-cream-300';
  let dot = 'bg-espresso-600';

  if (normalized.includes('VEGAN') || normalized.includes('VEGETARIAN') || normalized === 'VEG') {
    bg = 'bg-sage-50 text-sage-800 border-sage-200';
    dot = 'bg-sage-600';
  } else if (normalized.includes('GLUTEN_FREE') || normalized === 'GF') {
    bg = 'bg-amber-50 text-amber-900 border-amber-200';
    dot = 'bg-amber-600';
  } else if (normalized.includes('CHEF') || normalized.includes('RECOMMENDED')) {
    bg = 'bg-terracotta-50 text-terracotta-700 border-terracotta-200';
    dot = 'bg-terracotta-500';
  }

  const display = label.replace(/_/g, ' ').toLowerCase();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="capitalize">{display}</span>
    </span>
  );
}

