import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-cream-300 shadow-soft space-y-6">
        <Link href="/" className="text-xs font-semibold text-terracotta hover:underline">&larr; Back to Dishora</Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">Privacy Notice</h1>
        <p className="text-xs text-taupe-500">Effective Date: November 2026</p>

        <div className="prose text-xs sm:text-sm text-taupe-700 space-y-4 leading-relaxed">
          <p>
            Dishora is designed with privacy-first hospitality principles. Diners never need to download an application, create an account, or share personal identifying information (PII) to browse a restaurant menu.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">1. Diner Information Collection</h2>
          <p>
            We collect only anonymized session tokens, hashed IP identifiers for rate-limiting protection, and aggregated dish interaction metrics (e.g., dish card views, chat queries). We do not collect names, credit card information, or persistent cross-site tracking markers from diners.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">2. Restaurant Owner Data</h2>
          <p>
            For registered restaurant accounts, we collect business email, billing country/currency, uploaded menu assets, and restaurant profile details strictly necessary for providing multi-tenant SaaS services.
          </p>

          <h2 className="font-serif text-lg font-bold text-espresso-900">3. AI Conversation Logs</h2>
          <p>
            Diner queries sent to our conversational menu assistant are ephemeral and retained solely for short-term session continuity and aggregated analytics topics.
          </p>
        </div>
      </div>
    </div>
  );
}
