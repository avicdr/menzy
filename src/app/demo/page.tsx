import React from 'react';
import Link from 'next/link';
import { Utensils, ArrowRight, ExternalLink } from 'lucide-react';

export default function DemoPage() {
  const demos = [
    {
      title: 'Chai & Chutney Craft Kitchen',
      slug: 'chai-and-chutney',
      location: 'Bengaluru, India',
      currency: 'INR (₹)',
      theme: 'Warm Editorial',
      description: 'Progressive Indian small plates, claypot biryanis, and artisanal house-brewed chais in Indiranagar.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'The Gilded Fork Café & Bistro',
      slug: 'the-gilded-fork',
      location: 'San Francisco, USA',
      currency: 'USD ($)',
      theme: 'Botanical Café',
      description: 'Artisanal espresso, fresh-baked morning pastries, and Northern California seasonal comfort plates in Presidio Heights.',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Bakehouse 72 Artisan Bakery',
      slug: 'bakehouse-72-demo',
      location: 'Mumbai, India (Founder Demo)',
      currency: 'INR (₹)',
      theme: 'Pastel Patisserie',
      description: 'Claimable founder demo restaurant showcasing twice-baked almond croissants and single-origin pour-overs.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-semibold text-terracotta hover:underline">&larr; Back to Home</Link>
          <Link href="/signup" className="text-xs font-semibold text-espresso-800 hover:underline">Create Your Own Venue</Link>
        </div>

        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900">
            Interactive Live Menus
          </h1>
          <p className="text-sm text-taupe-600">
            Scan or tap to explore real working visual menus, grounded AI pairing assistants, and custom hospitality themes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demos.map((d) => (
            <div key={d.slug} className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between">
              <div className="relative aspect-video w-full bg-cream-100">
                <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-espresso-800 shadow">
                    {d.currency}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-espresso-900">{d.title}</h3>
                  <p className="text-xs text-taupe-500 mt-0.5">{d.location} • {d.theme}</p>
                  <p className="text-xs text-taupe-600 line-clamp-2 mt-2 leading-relaxed">{d.description}</p>
                </div>

                <Link
                  href={`/m/${d.slug}`}
                  target="_blank"
                  className="w-full py-2.5 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <span>Open Diner Menu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

