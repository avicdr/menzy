export type DishImageSourceKind =
  | 'OWNER_PHOTO'
  | 'AI_GENERATED'
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

