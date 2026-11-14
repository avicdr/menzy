export type DishImageSourceKind =
  | 'OWNER_PHOTO'
  | 'AI_GENERATED'
  | 'CANONICAL_REALISTIC'
  | 'CANONICAL_CLAY'
  | 'CANONICAL'
  | 'PLACEHOLDER';

export interface ResolvedDishImageMeta {
  url: string;
  sourceKind: DishImageSourceKind;
  label: string;
  hasCustomOverride: boolean;
}

export function resolveDishImageMeta(item: any): ResolvedDishImageMeta {
  const overrideUrl = item?.imageOverride?.publicUrl || null;
  if (overrideUrl) {
    const isOwnerPhoto =
      item?.imageOverride?.type === 'OWNER_PHOTO' ||
      item?.imageOverride?.source === 'OWNER_UPLOAD';
    if (item?.imageOverride?.source === 'CURATED_REALISTIC') {
      return {
        url: overrideUrl,
        sourceKind: 'CANONICAL_REALISTIC',
        label: 'Realistic food photo',
        hasCustomOverride: true,
      };
    }
    if (item?.imageOverride?.source === 'CURATED_CLAY' || item?.imageOverride?.source === 'CANONICAL_LIBRARY') {
      return {
        url: overrideUrl,
        sourceKind: 'CANONICAL_CLAY',
        label: '3D clay artwork',
        hasCustomOverride: true,
      };
    }
    return {
      url: overrideUrl,
      sourceKind: isOwnerPhoto ? 'OWNER_PHOTO' : 'AI_GENERATED',
      label: isOwnerPhoto ? 'Uploaded Photo' : 'AI Food Photo',
      hasCustomOverride: true,
    };
  }

  const canonicalUrl = item?.canonical?.imageAsset?.publicUrl || null;
  if (canonicalUrl) {
    return {
      url: canonicalUrl,
      sourceKind: 'CANONICAL',
      label: 'Canonical Library',
      hasCustomOverride: Boolean(item?.imageOverrideAssetId),
    };
  }

  return {
    url: '/placeholder-dish.svg',
    sourceKind: 'PLACEHOLDER',
    label: 'No Photo Yet',
    hasCustomOverride: Boolean(item?.imageOverrideAssetId),
  };
}
