'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  fullPage?: boolean;
  dark?: boolean;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
  ariaLabel?: string;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
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
  headerActions,
  children,
  footer,
  maxWidth = 'lg',
  fullPage = false,
  dark = false,
  showCloseButton = true,
  preventBackdropClose = false,
  ariaLabel,
  className = '',
  bodyClassName = '',
  footerClassName = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingProgrammaticallyRef = useRef(false);

  // Sync dialog top-layer open/close state with React props
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.setAttribute('closedby', preventBackdropClose ? 'closerequest' : 'any');

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Fallback if browser rejected showModal while detached
        }
      }
    } else if (dialog.open) {
      closingProgrammaticallyRef.current = true;
      dialog.close();
      closingProgrammaticallyRef.current = false;
    }
  }, [isOpen, preventBackdropClose]);

  // Close native modal cleanly if parent unmounts component directly while open
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog && dialog.open) {
        closingProgrammaticallyRef.current = true;
        dialog.close();
        closingProgrammaticallyRef.current = false;
      }
    };
  }, []);

  // Progressive fallback for backdrop click dismissal where <dialog closedby="any"> is unsupported
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || preventBackdropClose) return;
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    const isOutsideDialog = (e: PointerEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return false;
      const rect = dialog.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    let pressedOutside = false;

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = e.target === dialog && isOutsideDialog(e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && e.target === dialog && isOutsideDialog(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [preventBackdropClose]);

  const handleNativeCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    // Let React drive controlled closing so state remains single source of truth
    e.preventDefault();
    onCloseRef.current();
  };

  const handleNativeClose = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    const dialog = e.currentTarget;
    dialog.returnValue = '';
    if (closingProgrammaticallyRef.current) return;
    if (isOpenRef.current) {
      onCloseRef.current();
    }
  };

  const maxWidthClass = maxWidthMap[maxWidth] || 'max-w-lg';

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleNativeCancel}
      onClose={handleNativeClose}
      aria-labelledby={title ? headingId : undefined}
      aria-label={!title ? ariaLabel || 'Modal dialog' : undefined}
      className={`m-auto p-0 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] ${maxWidthClass} ${
        fullPage ? 'h-[calc(100dvh-1.5rem)] sm:h-[88dvh]' : 'max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh]'
      } rounded-3xl shadow-lifted border open:flex open:flex-col overflow-hidden focus:outline-none backdrop:backdrop-blur-sm ${
        dark
          ? 'bg-espresso-900 border-espresso-700 text-cream-100 backdrop:bg-black/80'
          : 'bg-white border-cream-300 text-espresso-900 backdrop:bg-espresso-950/75'
      } ${className}`}
    >
      {/* Header (fixed at top of dialog when title or close button provided) */}
      {(title || headerActions || showCloseButton) && (
        <div
          className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
            dark
              ? 'border-espresso-800 bg-espresso-950/40'
              : 'border-cream-200 bg-cream-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  dark ? 'bg-espresso-800 text-amber-400' : 'bg-espresso-900 text-white'
                }`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {typeof title === 'string' ? (
                <h3
                  id={headingId}
                  className={`font-serif text-lg sm:text-xl font-bold leading-snug ${
                    dark ? 'text-cream-100' : 'text-espresso-900'
                  }`}
                >
                  {title}
                </h3>
              ) : (
                <div id={headingId}>{title}</div>
              )}
              {subtitle && (
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    dark ? 'text-cream-300/70' : 'text-taupe-500'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={`min-w-11 min-h-11 p-2 rounded-xl transition-colors shrink-0 ${
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
        </div>
      )}

      {/* Scrollable Modal Body */}
      <div
        className={`flex-auto min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 ${bodyClassName}`}
      >
        {children}
      </div>

      {/* Footer (sticky at bottom of dialog when provided) */}
      {footer && (
        <div
          className={`px-4 sm:px-6 py-3.5 sm:py-4 border-t shrink-0 flex flex-wrap items-center justify-end gap-2.5 ${
            dark
              ? 'border-espresso-800 bg-espresso-950/40'
              : 'border-cream-200 bg-cream-50/70'
          } ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </dialog>
  );
}
