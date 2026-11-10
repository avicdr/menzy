'use client';

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { QrCode, Camera, Clock, X, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

interface BarcodeDetectionResult {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectionResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
}

interface RescanTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantSlug: string;
  restaurantName: string;
  reason?: 'EXPIRED' | 'REQUIRED' | 'INVALID_TOKEN';
  expiredTableName?: string | null;
}

export function RescanTableModal({
  isOpen,
  onClose,
  restaurantSlug,
  restaurantName,
  reason = 'EXPIRED',
  expiredTableName,
}: RescanTableModalProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pointerDownOutsideRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [scanMode, setScanMode] = useState<'prompt' | 'scanning' | 'unsupported' | 'error'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setScanMode('prompt');
    setCameraError(null);
    setScanHint(null);
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      stopCamera();
      setScanMode('prompt');
      setCameraError(null);
      setScanHint(null);
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const tryNavigateFromScannedUrl = useCallback(
    (rawValue: string): boolean => {
      try {
        const parsed = new URL(rawValue.trim(), window.location.origin);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        const mIndex = pathSegments.indexOf('m');
        const scannedSlug = mIndex >= 0 ? pathSegments[mIndex + 1] : null;
        const hasTableParam = Boolean(
          parsed.searchParams.get('t') ||
            parsed.searchParams.get('table')
        );

        if (
          scannedSlug &&
          scannedSlug.toLowerCase() === restaurantSlug.toLowerCase() &&
          hasTableParam
        ) {
          stopCamera();
          window.location.assign(`${parsed.pathname}${parsed.search}`);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [restaurantSlug, stopCamera]
  );

  const startScanner = async () => {
    setCameraError(null);
    setScanHint(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScanMode('unsupported');
      return;
    }

    const BarcodeDetectorCtor = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!BarcodeDetectorCtor) {
      setScanMode('unsupported');
      return;
    }

    try {
      if (BarcodeDetectorCtor.getSupportedFormats) {
        const formats = await BarcodeDetectorCtor.getSupportedFormats();
        if (Array.isArray(formats) && !formats.includes('qr_code')) {
          setScanMode('unsupported');
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      setScanMode('scanning');

      // Attach stream after video element renders
      requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;
        video.srcObject = streamRef.current;
        try {
          await video.play();
        } catch {}

        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        let isDetecting = false;

        scanTimerRef.current = window.setInterval(async () => {
          if (isDetecting || !videoRef.current || videoRef.current.readyState < 2) return;
          isDetecting = true;
          try {
            const barcodes = await detector.detect(videoRef.current);
            for (const code of barcodes) {
              if (!code.rawValue) continue;
              const matched = tryNavigateFromScannedUrl(code.rawValue);
              if (matched) return;
              setScanHint(
                `Detected a QR code that doesn't match a ${restaurantName} table. Point your camera at the QR tent on your table.`
              );
            }
          } catch {
            // Ignore transient frame detection errors
          } finally {
            isDetecting = false;
          }
        }, 220);
      });
    } catch (err: any) {
      stopCamera();
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was declined. Enable camera access in your browser settings or point your phone’s native Camera app at the table QR code.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError(
          'No camera was detected on this device. Please scan the table QR code using your phone’s Camera app.'
        );
      } else {
        setCameraError(
          'Could not open camera scanner here. Please scan the table QR code directly with your phone’s Camera app.'
        );
      }
      setScanMode('error');
    }
  };

  const isPointOutsideCard = (clientX: number, clientY: number) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    pointerDownOutsideRef.current = isPointOutsideCard(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (pointerDownOutsideRef.current && isPointOutsideCard(e.clientX, e.clientY)) {
      handleClose();
    }
    pointerDownOutsideRef.current = false;
  };

  const titleText =
    reason === 'INVALID_TOKEN'
      ? 'Table QR Updated'
      : reason === 'REQUIRED'
        ? 'Scan Table QR to Order'
        : 'Please Rescan Table QR';

  const bodyText =
    reason === 'INVALID_TOKEN'
      ? 'This table QR link is no longer valid or was refreshed by staff. Please scan the current QR code at your table.'
      : reason === 'REQUIRED'
        ? 'Connect to your table by scanning the table QR code before sending orders to the kitchen or calling a waiter.'
        : `No order has been placed from this device in the last 30 minutes${
            expiredTableName ? ` (${expiredTableName})` : ''
          }. To ensure only guests currently seated at the table can place orders, please rescan the table QR code.`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-transparent p-0 backdrop:bg-black/75 backdrop:backdrop-blur-md open:flex open:items-center open:justify-center focus:outline-none"
    >
      <div
        ref={cardRef}
        className="w-full max-h-[90dvh] overflow-y-auto bg-[var(--dishora-surface,#FFFFFF)] text-[var(--dishora-text,#35271F)] rounded-3xl border border-[var(--dishora-border,#E4D9CB)] shadow-2xl font-sans"
      >
        {/* Top Accent Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--dishora-border,#E4D9CB)] flex items-start justify-between gap-3 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              {reason === 'INVALID_TOKEN' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mb-1">
                {reason === 'EXPIRED'
                  ? '30-Min Session Timeout'
                  : reason === 'INVALID_TOKEN'
                    ? 'QR Code Verification'
                    : 'Table Verification Required'}
              </span>
              <h2
                id={headingId}
                className="font-serif text-lg font-bold text-[var(--dishora-text,#35271F)] leading-snug"
              >
                {titleText}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[var(--dishora-muted-text,#7C695C)] transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[var(--dishora-muted-text,#7C695C)] leading-relaxed">
            {bodyText}
          </p>

          {scanMode === 'scanning' ? (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-64 w-full mx-auto rounded-2xl overflow-hidden bg-black border-2 border-[var(--dishora-accent,#B86D52)] shadow-inner">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-44 h-44 rounded-2xl border-2 border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute bottom-2.5 inset-x-0 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium">
                    Point camera at table QR code
                  </span>
                </div>
              </div>

              {scanHint && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{scanHint}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setScanMode('prompt');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--dishora-border,#E4D9CB)] text-xs font-semibold text-[var(--dishora-text,#35271F)] hover:bg-black/5 transition-colors"
              >
                Stop Camera
              </button>
            </div>
          ) : scanMode === 'unsupported' ? (
            <div className="p-4 rounded-2xl bg-[var(--dishora-bg,#F7F3EC)] border border-[var(--dishora-border,#E4D9CB)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--dishora-text,#35271F)]">
                <QrCode className="w-4 h-4 text-[var(--dishora-accent,#B86D52)]" />
                <span>Use Your Phone Camera App</span>
              </div>
              <p className="text-xs text-[var(--dishora-muted-text,#7C695C)] leading-relaxed">
                In-browser QR scanning isn’t supported by this browser. Simply open your phone’s Camera app or QR scanner and point it at the QR code on your table to reconnect.
              </p>
            </div>
          ) : scanMode === 'error' && cameraError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
              <p className="text-xs text-rose-900 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startScanner}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Camera Again</span>
              </button>
            </div>
          ) : null}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {scanMode !== 'scanning' && (
              <button
                type="button"
                onClick={startScanner}
                className="w-full py-3.5 px-5 rounded-2xl bg-[var(--dishora-accent,#B86D52)] hover:opacity-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Table QR with Camera</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--dishora-muted-text,#7C695C)] hover:text-[var(--dishora-text,#35271F)] hover:bg-black/5 transition-colors"
            >
              Continue Browsing Menu (Read-Only)
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
