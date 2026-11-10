'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { trackConversionEvent } from '@/lib/analytics/events';

export function ContactFormClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [city, setCity] = useState('');
  const [inquiryType, setInquiryType] = useState<'DEMO' | 'MULTI_OUTLET' | 'SUPPORT' | 'PARTNERSHIP'>('DEMO');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          restaurantName,
          city,
          inquiryType,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send inquiry.');
      }

      setSuccessMsg(data.message || 'Inquiry received.');
      trackConversionEvent('contact_submitted', { inquiryType });
      if (inquiryType === 'DEMO') {
        trackConversionEvent('demo_requested', { source: 'contact_form' });
      }
      setName('');
      setEmail('');
      setRestaurantName('');
      setCity('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Unable to submit your inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-taupe-700 mb-1">
            Your Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Mehta"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-taupe-700 mb-1">
            Work Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@restaurant.in"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-restaurant" className="block text-xs font-semibold text-taupe-700 mb-1">
            Restaurant / Café Name
          </label>
          <input
            id="contact-restaurant"
            name="restaurantName"
            type="text"
            required
            autoComplete="organization"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="Spice & Sourdough"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="contact-city" className="block text-xs font-semibold text-taupe-700 mb-1">
            City &amp; Country
          </label>
          <input
            id="contact-city"
            name="city"
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bengaluru, India"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="block text-xs font-semibold text-taupe-700 mb-1">
          How can we help?
        </label>
        <select
          id="contact-topic"
          name="inquiryType"
          value={inquiryType}
          onChange={(e) => setInquiryType(e.target.value as any)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
        >
          <option value="DEMO">Request a Custom Pre-Built Menu Demo</option>
          <option value="MULTI_OUTLET">Multi-Outlet / Group Rollout</option>
          <option value="PARTNERSHIP">POS / Hospitality Partnership</option>
          <option value="SUPPORT">Operator Support Question</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-taupe-700 mb-1">
          Tell us about your menu &amp; table setup
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Number of tables, dining style, or link to your current PDF/website menu..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 transition-colors flex items-center justify-center gap-2 shadow disabled:opacity-50"
      >
        <span>{submitting ? 'Sending inquiry...' : 'Send Message'}</span>
        <Send className="w-4 h-4" aria-hidden="true" />
      </button>
    </form>
  );
}

