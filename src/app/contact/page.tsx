import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock, MapPin, Phone, Sparkles } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { ContactFormClient } from '@/components/marketing/ContactFormClient';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '@/lib/support/contact';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Menzy — Restaurant Software',
  description:
    'Contact the Menzy team to request a custom restaurant digital menu demo, multi-outlet onboarding, or operator support in India and international markets.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe-600">
            <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
            <span className="font-semibold text-espresso-900">Contact</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900 leading-tight">
                  Let&apos;s bring your menu to life
                </h1>
                <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                  Share your current menu link, number of tables, or outlet count. We can prepare a claimable visual demo or answer onboarding questions cleanly.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-cream-200 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-terracotta shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-espresso-900">Setup &amp; Onboarding Helpline</div>
                    <p className="text-xs text-taupe-600 mt-0.5">
                      Have setup or onboarding queries? Call or WhatsApp{' '}
                      <a
                        href={SUPPORT_PHONE_HREF}
                        className="font-semibold text-espresso-900 hover:text-terracotta underline underline-offset-2"
                      >
                        {SUPPORT_PHONE_DISPLAY}
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-cream-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-terracotta shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-espresso-900">Pre-Built Demo Menus</div>
                    <p className="text-xs text-taupe-600 mt-0.5">
                      Want to preview how your dishes look in 3D-clay style? Send your venue name and menu link.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-cream-200 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-sage-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-espresso-900">India &amp; International Support</div>
                    <p className="text-xs text-taupe-600 mt-0.5">
                      Built for India (INR / FSSAI Veg &amp; Non-Veg markers) and United States / global dining rooms.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-cream-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-espresso-800 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-espresso-900">Self-Serve in 3 Minutes</div>
                    <p className="text-xs text-taupe-600 mt-0.5">
                      Prefer to try right now?{' '}
                      <Link href="/signup" className="text-terracotta-700 font-semibold hover:underline">
                        Create your workspace immediately
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl border border-cream-300 shadow-lifted p-6 sm:p-8">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 mb-5">
                Send an inquiry
              </h2>
              <ContactFormClient />
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

