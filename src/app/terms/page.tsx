import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-cream-300 shadow-soft space-y-6">
        <Link href="/" className="text-xs font-semibold text-terracotta hover:underline">&larr; Back to Menzy</Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">Terms of Service</h1>
        <p className="text-xs text-taupe-500">Effective Date: November 2026</p>

        <div className="prose text-xs sm:text-sm text-taupe-700 space-y-4 leading-relaxed">
          <p>
            Welcome to Menzy ("we", "our", or "us"). By accessing or using our interactive digital menu platform, APIs, or services, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">1. SaaS Platform & Restaurant Responsibilities</h2>
          <p>
            Restaurant operators are solely responsible for verifying the accuracy of prices, ingredients, allergen statements, and nutritional representations. Menzy provides automated OCR extraction and AI culinary recommendations as tools, but does not warrant the clinical allergen-free safety of food prepared by individual establishments.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">2. Subscriptions & Billing</h2>
          <p>
            Menzy subscriptions are billed on a recurring monthly cycle via Razorpay. Cancellations take effect at the conclusion of the paid billing period. Image credits and AI question allowances are non-transferable between organizations and reset once per paid billing period.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">3. AI-Generated Visual Illustrations</h2>
          <p>
            Illustrations generated via our 3D clay studio represent conceptual artistic depictions of dishes and should be understood as stylized culinary previews rather than contractual representations of plating.
          </p>
        </div>
      </div>
    </div>
  );
}

