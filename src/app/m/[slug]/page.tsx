import React from 'react';
import { CartProvider } from '@/lib/diner/cart-context';
import { DinerMenuClient } from '@/components/diner/DinerMenuClient';
import { loadDinerMenuPayloadCached } from '@/lib/diner/diner-menu-loader';

export const dynamic = 'force-dynamic';

interface DinerMenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    t?: string;
    table?: string;
    tableId?: string;
    view?: string;
  }>;
}

export default async function DinerMenuPage({ params, searchParams }: DinerMenuPageProps) {
  const [{ slug: rawSlug }, query] = await Promise.all([params, searchParams]);
  const slug = decodeURIComponent(rawSlug || '').trim();

  const result = await loadDinerMenuPayloadCached(slug);

  const initialMenuData = result.status === 'OK' ? result.data : null;
  const initialPausedPayload = result.status === 'PAUSED' ? result.pausedPayload : null;
  const initialError = result.status === 'NOT_FOUND' ? 'Menu not found' : null;

  const initialViewMode: 'landing' | 'menu' = query?.view === 'menu' ? 'menu' : 'landing';
  const initialTableToken =
    typeof query?.t === 'string' && query.t.trim()
      ? query.t.trim()
      : typeof query?.table === 'string' && query.table.trim()
        ? query.table.trim()
        : null;
  const initialTableIdParam =
    typeof query?.tableId === 'string' && query.tableId.trim() ? query.tableId.trim() : null;

  return (
    <CartProvider restaurantSlug={slug}>
      <DinerMenuClient
        key={slug}
        initialSlug={slug}
        initialMenuData={initialMenuData}
        initialPausedPayload={initialPausedPayload}
        initialError={initialError}
        initialViewMode={initialViewMode}
        initialTableToken={initialTableToken}
        initialTableIdParam={initialTableIdParam}
      />
    </CartProvider>
  );
}
