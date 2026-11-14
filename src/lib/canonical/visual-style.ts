export type CanonicalVisualStyle = 'REALISTIC' | 'CLAY';

export function getCanonicalVisualStyle(asset: {
  source?: string | null;
  prompt?: string | null;
} | null | undefined): CanonicalVisualStyle {
  const source = String(asset?.source || '').toUpperCase();
  const prompt = String(asset?.prompt || '').toLowerCase();

  if (
    source.includes('REALISTIC') ||
    source.includes('PHOTO') ||
    source === 'OWNER_UPLOAD'
  ) {
    return 'REALISTIC';
  }

  if (
    source.includes('CLAY') ||
    source === 'CANONICAL_LIBRARY' ||
    prompt.includes('3d-clay') ||
    prompt.includes('plasticine')
  ) {
    return 'CLAY';
  }

  return 'REALISTIC';
}

export function getCanonicalVisualStyleLabel(style: CanonicalVisualStyle): string {
  return style === 'REALISTIC' ? 'Realistic food photo' : '3D clay artwork';
}
