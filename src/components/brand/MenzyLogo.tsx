import React from 'react';

interface MenzyLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function MenzyLogo({
  size = 36,
  className = '',
  showWordmark = false,
  wordmarkClassName = 'font-serif text-xl sm:text-2xl font-bold text-espresso-900 tracking-tight',
}: MenzyLogoProps) {
  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 shrink-0">
      <img
        src="/logo.png"
        alt="Menzy logo"
        width={size}
        height={size}
        className={`rounded-xl object-contain shrink-0 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      />
      {showWordmark && <span className={wordmarkClassName}>Menzy</span>}
    </span>
  );
}

