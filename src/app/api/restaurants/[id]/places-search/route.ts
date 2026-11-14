import { NextResponse } from 'next/server';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import {
  getGenAIClient,
  getTextModelCandidates,
  isGeminiModelUnavailableError,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from '@/lib/gemini/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ places: [] });
    }

    const places: Array<{
      id: string;
      name: string;
      address: string;
      mapsUrl: string;
      reviewUrl: string;
      source: string;
    }> = [];

    // 1. Try Gemini Google Search Grounding across configured Gemini API keys & models
    const geminiClients = resolveGeminiAttemptClients(getGenAIClient('text'), 'text');
    const modelCandidates = getTextModelCandidates();
    let searchCompleted = false;

    for (const candidateModel of modelCandidates) {
      if (searchCompleted) break;
      for (const entry of geminiClients) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
          const resp: any = await entry.client.models.generateContent({
            model: candidateModel,
            contents: `Find the Google Business / Google Maps listing(s) for restaurant/cafe query: "${q}". Return up to 4 real matching places with their exact name, street address/city, and any Google Maps URL or place info if known.`,
            config: {
              tools: [{ googleSearch: {} }],
              abortSignal: controller.signal,
              // Google GenAI rejects X-Server-Timeout < 10s with 400 INVALID_ARGUMENT
              httpOptions: { timeout: 10000 },
            },
          });

          const groundingChunks = (resp as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          for (const chunk of groundingChunks) {
            if (chunk?.web?.uri && (chunk.web.uri.includes('google.com/maps') || chunk.web.uri.includes('goo.gl') || chunk.web.uri.includes('g.page'))) {
              places.push({
                id: `google_${places.length}`,
                name: chunk.web.title || q,
                address: 'Verified Google Listing',
                mapsUrl: chunk.web.uri,
                reviewUrl: chunk.web.uri,
                source: 'Google Search',
              });
            }
          }
          searchCompleted = true;
          break;
        } catch (geminiErr) {
          if (isGeminiModelUnavailableError(geminiErr)) {
            console.warn(`Gemini search model unavailable (${candidateModel}); trying the next model.`);
            break;
          }
          if (entry.key !== 'mock-injected-client') {
            markGeminiKeyCooldown(entry.key, geminiErr, 'text');
          }
          console.warn(`Gemini search grounding failed (${candidateModel}, key ${entry.maskedKey}):`, geminiErr);
        } finally {
          clearTimeout(timer);
        }
      }
    }

    // 2. Also query OpenStreetMap Nominatim for real location candidates
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'MenzyMenuSaaS/1.0',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        for (const item of nomData) {
          const displayName = item.display_name || q;
          const shortName = item.name || displayName.split(',')[0] || q;
          const queryParam = encodeURIComponent(`${shortName} ${item.address?.city || item.address?.town || ''}`.trim());
          const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${queryParam}`;

          places.push({
            id: `osm_${item.place_id}`,
            name: shortName,
            address: displayName,
            mapsUrl: mapsSearchUrl,
            reviewUrl: mapsSearchUrl,
            source: 'Maps Directory',
          });
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim search failed:', nomErr);
    }

    // Always include a direct Google Business Search action as fallback
    const directMapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    if (places.length === 0) {
      places.push({
        id: 'direct_google_search',
        name: q,
        address: 'Search directly on Google Maps & copy your Share / Review link',
        mapsUrl: directMapsSearch,
        reviewUrl: directMapsSearch,
        source: 'Google Maps Direct',
      });
    }

    return NextResponse.json({ places });
  } catch (error: any) {
    console.error('Places search error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
