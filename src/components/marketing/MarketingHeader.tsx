'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { MenzyLogo } from '@/components/brand/MenzyLogo';

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/table-ordering', label: 'Ordering' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/demo', label: 'Live demo' },
];

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="marketing-header">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="marketing-frame header-inner" aria-label="Primary">
        <Link href="/" className="brand-link" aria-label="Menzy home"><MenzyLogo size={30} showWordmark wordmarkClassName="brand-wordmark" /></Link>
        <div className="header-nav">{navLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
        <div className="header-actions"><Link href="/login" className="header-signin">Sign in</Link><Link href="/signup" className="button button-header">Create your menu <ArrowRight size={15} /></Link></div>
        <button ref={menuButtonRef} type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>
      {menuOpen && <div className="mobile-navigation" id="mobile-navigation"><div className="mobile-navigation-inner"><button ref={closeButtonRef} type="button" className="mobile-close" onClick={closeMenu}><span>Menu</span><X size={22} /></button><div className="mobile-links">{navLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu}>{item.label}<ArrowRight size={18} /></Link>)}</div><div className="mobile-actions"><Link href="/login" onClick={closeMenu}>Sign in</Link><Link href="/signup" className="button button-primary" onClick={closeMenu}>Create your menu <ArrowRight size={16} /></Link></div></div></div>}
    </header>
  );
}
