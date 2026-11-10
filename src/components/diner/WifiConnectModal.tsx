'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Wifi, X, Copy, Check, QrCode as QrIcon, ShieldCheck } from 'lucide-react';
import { buildWifiQrString } from '@/lib/wifi/wifi-qr';

interface WifiConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  wifi: {
    ssid: string;
    password?: string;
    security?: string;
  };
}

export function WifiConnectModal({
  isOpen,
  onClose,
  restaurantName,
  wifi,
}: WifiConnectModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && wifi?.ssid) {
      // Standard Wi-Fi QR code syntax for iOS/Android camera instant join
      const wifiString = buildWifiQrString(wifi);
      QRCode.toDataURL(wifiString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#140E0A',
          light: '#FAF7F2',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed to generate Wi-Fi QR:', err));
    }
  }, [isOpen, wifi]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!wifi?.password) return;
    navigator.clipboard.writeText(wifi.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-[#1C1614] text-cream-100 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-cream-200/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#140E0A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-cream-50 leading-tight">
                Guest Free Wi-Fi
              </h2>
              <p className="text-[11px] text-taupe-400">{restaurantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-taupe-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* QR Code Container */}
          {qrDataUrl && (
            <div className="space-y-2">
              <div className="w-44 h-44 mx-auto p-2.5 bg-[#FAF7F2] rounded-2xl shadow-lifted border border-white/20 flex items-center justify-center">
                <img src={qrDataUrl} alt="Scan to join Wi-Fi" className="w-full h-full object-contain" />
              </div>
              <p className="text-[11px] text-taupe-400 flex items-center justify-center gap-1">
                <QrIcon className="w-3.5 h-3.5 text-emerald-400" />
                Scan with phone camera for instant 1-tap connection
              </p>
            </div>
          )}

          {/* Credentials Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-taupe-400 block mb-0.5">
                Network Name (SSID)
              </span>
              <span className="text-sm font-bold text-cream-50 font-mono select-all">
                {wifi?.ssid || 'Guest Wi-Fi'}
              </span>
            </div>

            {wifi?.password ? (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-taupe-400 block mb-0.5">
                    Wi-Fi Password
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-400 select-all">
                    {wifi.password}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 text-cream-100 transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-xs text-taupe-400 pt-1">
                Open network (No password required).
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-cream-100 text-xs font-semibold transition-colors"
            >
              Close & Return to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

