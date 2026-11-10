'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  fullPage?: boolean;
  dark?: boolean;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
  className?: string;
  bodyClassName?: string;
}

const maxWidthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'lg',
  fullPage = false,
  dark = false,
  showCloseButton = true,
  preventBackdropClose = false,
  className = '',
  bodyClassName = '',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof document === 'undefined') {
    return null;
  }

  const maxWidthClass = maxWidthMap[maxWidth] || 'max-w-lg';

  const modalContent = (
    <div
      className={`fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm animate-modal-backdrop ${
        dark ? 'bg-black/80' : 'bg-espresso-950/70'
      }`}
      onClick={(e) => {
        if (!preventBackdropClose && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClass} rounded-3xl shadow-lifted border flex flex-col overflow-hidden animate-modal-content transition-all ${
          fullPage ? 'h-[92vh] sm:h-[88vh]' : 'max-h-[92vh]'
        } ${
          dark
            ? 'bg-espresso-900 border-espresso-700 text-cream-100'
            : 'bg-white border-cream-300 text-espresso-900'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (if title or close button provided) */}
        {(title || showCloseButton) && (
          <div
            className={`px-6 py-4.5 border-b flex items-center justify-between shrink-0 ${
              dark
                ? 'border-espresso-800 bg-espresso-950/40'
                : 'border-cream-200 bg-cream-50/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              {icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    dark
                      ? 'bg-espresso-800 text-amber-400'
                      : 'bg-espresso-900 text-white'
                  }`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3
                    className={`font-serif text-lg sm:text-xl font-bold truncate ${
                      dark ? 'text-cream-100' : 'text-espresso-900'
                    }`}
                  >
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      dark ? 'text-cream-300/70' : 'text-taupe-500'
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  dark
                    ? 'text-cream-300/70 hover:text-white hover:bg-espresso-800'
                    : 'text-taupe-400 hover:text-espresso-800 hover:bg-cream-100'
                }`}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div
          className={`flex-1 overflow-y-auto p-5 sm:p-6 ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Modal Footer (if provided) */}
        {footer && (
          <div
            className={`px-6 py-4 border-t shrink-0 flex items-center justify-end gap-2.5 ${
              dark
                ? 'border-espresso-800 bg-espresso-950/40'
                : 'border-cream-200 bg-cream-50/50'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

