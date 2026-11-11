'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  Flame,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FssaiMarker } from '@/components/diner/DietaryBadge';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { resolveDishImageMeta } from '@/lib/diner/dish-image-source';
import {
  DISH_PHOTO_ACCEPT,
  revertDishImageOverride,
  uploadDishPhotoFile,
} from '@/lib/images/client-dish-photo';
import {
  CandidateReviewModal,
  type CandidateReviewState,
  requestIllustrationCandidate,
} from '@/components/dashboard/CandidateReviewModal';
import { DishPreviewModal } from '@/components/dashboard/DishPreviewModal';
import { CanonicalGalleryModal } from '@/components/dashboard/CanonicalGalleryModal';

interface DashboardMenuTabProps {
  restaurant: any;
  menuItems: any[];
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  secondaryLoadingItems: boolean;
  isIndianRestaurant: boolean;
  isUploadingMenu: boolean;
  uploadProgress: string | null;
  isDraggingMenuFiles: boolean;
  extractionError: string | null;
  setExtractionError: (err: string | null) => void;
  extractionSuccess: string | null;
  setExtractionSuccess: (msg: string | null) => void;
  menuPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  menuPdfInputRef: React.RefObject<HTMLInputElement | null>;
  handleMenuDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleMenuDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleMenuDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSubscriptionExpired: (payload?: any) => void;
  onBillingUpdated?: (billingData: any) => void;
}

export function DashboardMenuTab({
  restaurant,
  menuItems,
  setMenuItems,
  secondaryLoadingItems,
  isIndianRestaurant,
  isUploadingMenu,
  uploadProgress,
  isDraggingMenuFiles,
  extractionError,
  setExtractionError,
  extractionSuccess,
  setExtractionSuccess,
  menuPhotoInputRef,
  menuPdfInputRef,
  handleMenuDragOver,
  handleMenuDragLeave,
  handleMenuDrop,
  onSubscriptionExpired,
  onBillingUpdated,
}: DashboardMenuTabProps) {
  const [menuFilter, setMenuFilter] = useState<string>('ALL');

  // Add Dish Modal State
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(
    restaurant?.currency === 'USD' ? '12.50' : '250'
  );
  const [newDishCategory, setNewDishCategory] = useState('');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishIsPopular, setNewDishIsPopular] = useState(false);
  const [newDishChefRecommended, setNewDishChefRecommended] = useState(false);
  const [newDishFoodType, setNewDishFoodType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [newDishDietaryTags, setNewDishDietaryTags] = useState<string[]>([]);
  const [newDishPhotoFile, setNewDishPhotoFile] = useState<File | null>(null);
  const [newDishPhotoPreviewUrl, setNewDishPhotoPreviewUrl] = useState<string | null>(null);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [addDishError, setAddDishError] = useState<string | null>(null);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [isEditDishOpen, setIsEditDishOpen] = useState(false);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState('');
  const [editDishCategory, setEditDishCategory] = useState('');
  const [editDishDescription, setEditDishDescription] = useState('');
  const [editDishIsPopular, setEditDishIsPopular] = useState(false);
  const [editDishChefRecommended, setEditDishChefRecommended] = useState(false);
  const [editDishFoodType, setEditDishFoodType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [editDishDietaryTags, setEditDishDietaryTags] = useState<string[]>([]);
  const [editDishIsAvailable, setEditDishIsAvailable] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editPhotoBusy, setEditPhotoBusy] = useState(false);
  const [editDishError, setEditDishError] = useState<string | null>(null);

  // Preview, Gallery & Quick Photo Upload State
  const [previewDishId, setPreviewDishId] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTargetDishId, setGalleryTargetDishId] = useState<string>('');
  const [quickUploadTargetDishId, setQuickUploadTargetDishId] = useState<string | null>(null);
  const [uploadingQuickDishId, setUploadingQuickDishId] = useState<string | null>(null);
  const [photoActionNotice, setPhotoActionNotice] = useState<string | null>(null);
  const [photoActionError, setPhotoActionError] = useState<string | null>(null);

  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const addPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const editNameId = useId();
  const editCategoryId = useId();
  const editPriceId = useId();
  const editDescId = useId();
  const editPhotoInputId = useId();
  const addNameId = useId();
  const addCategoryId = useId();
  const addPriceId = useId();
  const addDescId = useId();
  const addPhotoInputId = useId();

  useEffect(() => {
    if (!newDishPhotoFile) {
      setNewDishPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newDishPhotoFile);
    setNewDishPhotoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [newDishPhotoFile]);

  const previewDish = useMemo(
    () => (previewDishId ? menuItems.find((i) => i.id === previewDishId) ?? null : null),
    [previewDishId, menuItems]
  );

  const activeEditingDish = useMemo(
    () => (editingDish ? menuItems.find((i) => i.id === editingDish.id) || editingDish : null),
    [editingDish, menuItems]
  );

  // Delete Dish Modal State
  const [dishToDelete, setDishToDelete] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingDish, setIsDeletingDish] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Candidate Illustration Preview State
  const [isGeneratingImg, setIsGeneratingImg] = useState<string | null>(null);
  const [candidateReview, setCandidateReview] = useState<CandidateReviewState | null>(null);

  const syncUpdatedDish = (updatedItem: any) => {
    setMenuItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i))
    );
  };

  const showPhotoNotice = (msg: string) => {
    setPhotoActionError(null);
    setPhotoActionNotice(msg);
    setTimeout(() => {
      setPhotoActionNotice((current) => (current === msg ? null : current));
    }, 4000);
  };

  const existingCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of menuItems) {
      if (it.category) {
        map.set(it.category.id, it.category.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [menuItems]);

  const handleToggleAvailability = async (item: any) => {
    const updated = !item.isAvailable;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        isAvailable: updated,
      }),
    });
  };

  const handleTogglePopular = async (item: any) => {
    const updated = !item.isPopular;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPopular: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        isPopular: updated,
      }),
    });
  };

  const handleToggleChefPick = async (item: any) => {
    const updated = !item.chefRecommended;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, chefRecommended: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        chefRecommended: updated,
      }),
    });
  };

  const handlePromptDeleteDish = (item: any) => {
    setDishToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteDish = async () => {
    if (!dishToDelete) return;
    setIsDeletingDish(true);
    try {
      const res = await fetch(
        `/api/menus/items?itemId=${dishToDelete.id}&restaurantId=${restaurant.id}`,
        { method: 'DELETE' }
      );
      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setIsDeleteDialogOpen(false);
        onSubscriptionExpired(payload);
        return;
      }
      if (res.ok) {
        setMenuItems((prev) => prev.filter((i) => i.id !== dishToDelete.id));
        setDeleteToast(`"${dishToDelete.customName}" was removed from your menu.`);
        setTimeout(() => setDeleteToast(null), 3500);
        setIsDeleteDialogOpen(false);
        setDishToDelete(null);
      } else {
        alert('Failed to delete dish');
      }
    } catch {
      alert('Error deleting dish');
    } finally {
      setIsDeletingDish(false);
    }
  };

  const handleOpenEditDish = (item: any) => {
    setEditingDish(item);
    setEditDishError(null);
    setEditDishName(item.customName || '');
    setEditDishPrice(item.priceMinor ? (item.priceMinor / 100).toFixed(2) : '0.00');
    setEditDishCategory(item.categoryId || '');
    setEditDishDescription(item.restaurantDescription || '');
    setEditDishIsPopular(Boolean(item.isPopular));
    setEditDishChefRecommended(Boolean(item.chefRecommended));
    setEditDishIsAvailable(Boolean(item.isAvailable));

    const tags = ((item.dietaryStatus as string[]) || []).map((t) => t.toUpperCase());
    const isNonVeg = tags.some((l) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l));
    const isEgg = tags.some((l) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l));
    setEditDishFoodType(isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : 'VEG');

    const customTags = ((item.dietaryStatus as string[]) || []).filter(
      (t) =>
        ![
          'VEG',
          'VEGETARIAN',
          'PURE_VEG',
          'NON_VEG',
          'NON-VEG',
          'NONVEG',
          'EGG',
          'CONTAINS_EGG',
          'EGGETARIAN',
        ].includes(t.toUpperCase())
    );
    setEditDishDietaryTags(customTags);
    setIsEditDishOpen(true);
  };

  const handleSaveEditedDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editDishName.trim()) return;

    setIsSavingEdit(true);
    setEditDishError(null);
    try {
      const priceMinor = Math.round(parseFloat(editDishPrice || '0') * 100);
      const dietaryStatus = isIndianRestaurant
        ? [editDishFoodType, ...editDishDietaryTags]
        : editDishDietaryTags;

      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingDish.id,
          restaurantId: restaurant.id,
          customName: editDishName.trim(),
          priceMinor,
          description: editDishDescription.trim(),
          categoryId: editDishCategory || undefined,
          isPopular: editDishIsPopular,
          chefRecommended: editDishChefRecommended,
          isAvailable: editDishIsAvailable,
          dietaryStatus,
        }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setIsEditDishOpen(false);
        onSubscriptionExpired(payload);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        syncUpdatedDish(data.item);
        setIsEditDishOpen(false);
        setEditingDish(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setEditDishError(data?.error || 'Failed to save changes to dish.');
      }
    } catch {
      setEditDishError('Error updating dish. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleQuickRowPhotoClick = (itemId: string) => {
    setPhotoActionError(null);
    setQuickUploadTargetDishId(itemId);
    if (quickPhotoInputRef.current) {
      quickPhotoInputRef.current.value = '';
      quickPhotoInputRef.current.click();
    }
  };

  const handleQuickRowPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = quickUploadTargetDishId;
    if (!file || !targetId) return;

    const targetDish = menuItems.find((i) => i.id === targetId);
    setUploadingQuickDishId(targetId);
    setPhotoActionError(null);
    try {
      const res = await uploadDishPhotoFile({
        restaurantId: restaurant.id,
        menuItemId: targetId,
        file,
      });

      if (res.expired) {
        onSubscriptionExpired(res.payload);
        return;
      }

      const updatedItem =
        res.item ||
        (targetDish
          ? {
              ...targetDish,
              imageOverrideAssetId: res.asset.id,
              imageOverride: res.asset,
            }
          : null);

      if (updatedItem) {
        syncUpdatedDish(updatedItem);
      }
      showPhotoNotice(
        targetDish
          ? `Uploaded your photo for "${targetDish.customName}".`
          : 'Dish photo updated on your menu.'
      );
    } catch (err: any) {
      setPhotoActionError(err?.message || 'Could not upload dish photo. Please try again.');
    } finally {
      setUploadingQuickDishId(null);
      setQuickUploadTargetDishId(null);
      if (quickPhotoInputRef.current) {
        quickPhotoInputRef.current.value = '';
      }
    }
  };

  const handleEditModalPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEditingDish) return;

    setEditPhotoBusy(true);
    setEditDishError(null);
    try {
      const res = await uploadDishPhotoFile({
        restaurantId: restaurant.id,
        menuItemId: activeEditingDish.id,
        file,
      });
      if (res.expired) {
        setIsEditDishOpen(false);
        onSubscriptionExpired(res.payload);
        return;
      }
      const updatedItem =
        res.item || {
          ...activeEditingDish,
          imageOverrideAssetId: res.asset.id,
          imageOverride: res.asset,
        };
      syncUpdatedDish(updatedItem);
      setEditingDish(updatedItem);
    } catch (err: any) {
      setEditDishError(err?.message || 'Failed to upload dish photo.');
    } finally {
      setEditPhotoBusy(false);
      if (editPhotoInputRef.current) {
        editPhotoInputRef.current.value = '';
      }
    }
  };

  const handleEditModalRevertPhoto = async () => {
    if (!activeEditingDish) return;
    setEditPhotoBusy(true);
    setEditDishError(null);
    try {
      const res = await revertDishImageOverride({
        restaurantId: restaurant.id,
        itemId: activeEditingDish.id,
      });
      if (res.expired) {
        setIsEditDishOpen(false);
        onSubscriptionExpired(res.payload);
        return;
      }
      if (res.item) {
        syncUpdatedDish(res.item);
        setEditingDish(res.item);
      }
    } catch (err: any) {
      setEditDishError(err?.message || 'Failed to remove custom image.');
    } finally {
      setEditPhotoBusy(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || isAddingDish) return;

    setIsAddingDish(true);
    setAddDishError(null);
    try {
      const priceMinor = Math.round(parseFloat(newDishPrice || '0') * 100);
      const finalDietaryStatus = isIndianRestaurant
        ? [newDishFoodType, ...newDishDietaryTags]
        : [...newDishDietaryTags];

      const res = await fetch('/api/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          categoryId: newDishCategory || undefined,
          categoryName: newDishCategory ? undefined : 'Chef Specials',
          customName: newDishName.trim(),
          priceMinor,
          description: newDishDescription.trim(),
          currency: restaurant.currency,
          isPopular: newDishIsPopular,
          chefRecommended: newDishChefRecommended,
          dietaryStatus: finalDietaryStatus,
        }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setIsAddDishOpen(false);
        onSubscriptionExpired(payload);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setAddDishError(errData?.error || 'Could not add dish. Please check details and try again.');
        return;
      }

      const data = await res.json();
      let createdItem = data.item;

      if (newDishPhotoFile && createdItem?.id) {
        try {
          const uploadRes = await uploadDishPhotoFile({
            restaurantId: restaurant.id,
            menuItemId: createdItem.id,
            file: newDishPhotoFile,
          });
          if (uploadRes.expired) {
            setMenuItems((prev) => [...prev, createdItem]);
            setIsAddDishOpen(false);
            onSubscriptionExpired(uploadRes.payload);
            return;
          }
          createdItem =
            uploadRes.item || {
              ...createdItem,
              imageOverrideAssetId: uploadRes.asset.id,
              imageOverride: uploadRes.asset,
            };
        } catch (photoErr: any) {
          setPhotoActionError(
            `Dish "${createdItem.customName}" was saved, but its photo failed to upload: ${
              photoErr?.message || 'Try uploading again from Dish Preview.'
            }`
          );
        }
      }

      setMenuItems((prev) => [...prev, createdItem]);
      setIsAddDishOpen(false);
      setNewDishName('');
      setNewDishDescription('');
      setNewDishPrice(restaurant.currency === 'USD' ? '12.50' : '250');
      setNewDishCategory('');
      setNewDishIsPopular(false);
      setNewDishChefRecommended(false);
      setNewDishFoodType('VEG');
      setNewDishDietaryTags([]);
      setNewDishPhotoFile(null);
    } catch {
      setAddDishError('Network error while adding dish. Please try again.');
    } finally {
      setIsAddingDish(false);
    }
  };

  const handleGenerateIllustration = async (
    item: any,
    tweak?: string,
    options?: { throwOnError?: boolean }
  ) => {
    setIsGeneratingImg(item.id);
    setPhotoActionError(null);
    try {
      const candidate = await requestIllustrationCandidate({
        restaurantId: restaurant.id,
        item,
        tweak,
        onSubscriptionExpired,
        onBillingUpdated,
      });
      if (candidate) {
        setCandidateReview(candidate);
      }
    } catch (err: any) {
      const errMsg =
        err?.message || `Could not generate food photo for "${item.customName}". Please try again.`;
      if (options?.throwOnError) {
        throw new Error(errMsg);
      }
      setPhotoActionError(errMsg);
    } finally {
      setIsGeneratingImg(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">Menu Studio</h2>
          <p className="text-xs text-taupe-500">
            Edit dish names, prices, recipes, dietary tags, custom photos, and AI food visuals
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => menuPhotoInputRef.current?.click()}
            disabled={isUploadingMenu}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-cream-200 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-300 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <Camera className="w-4 h-4 text-terracotta" />
            <span>Upload Photos</span>
          </button>

          <button
            type="button"
            onClick={() => menuPdfInputRef.current?.click()}
            disabled={isUploadingMenu}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-cream-200 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-300 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <FileText className="w-4 h-4 text-terracotta" />
            <span>Upload PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDishOpen(true)}
            className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-[var(--dishora-accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <Plus className="w-4 h-4" /> Add Dish
          </button>
        </div>
      </div>

      {/* Delete & Photo Action Notifications */}
      {deleteToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
          <span>{deleteToast}</span>
        </div>
      )}

      {photoActionNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
            <span>{photoActionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhotoActionNotice(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-sage-700 hover:bg-sage-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {photoActionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in shadow-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{photoActionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhotoActionError(null)}
            aria-label="Dismiss error"
            className="p-1 rounded-lg text-red-600 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={quickPhotoInputRef}
        type="file"
        accept={DISH_PHOTO_ACCEPT}
        onChange={handleQuickRowPhotoChange}
        className="hidden"
        aria-label="Upload dish photo"
      />

      {/* Menu Extraction Error Notification */}
      {extractionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm text-red-900 animate-fade-in shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-950 text-sm">Menu Extraction Failed</h4>
              <p className="text-red-800 mt-1 leading-relaxed">{extractionError}</p>
              <p className="text-red-700/80 text-[11px] mt-1.5 font-medium">
                Notice: Your menu was not modified and no dummy dishes were added. For photos, ensure good lighting and crisp text; for PDFs, ensure the file is unlocked and uncorrupted.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExtractionError(null)}
            className="p-1.5 rounded-lg text-red-500 hover:text-red-800 hover:bg-red-100 transition-colors shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Menu Extraction Success Notification */}
      {extractionSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
            <span className="font-medium">{extractionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setExtractionSuccess(null)}
            className="p-1 rounded-lg text-sage-600 hover:bg-sage-100 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress Alert */}
      {isUploadingMenu && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-amber-900 animate-fade-in"
        >
          <RefreshCw className="w-5 h-5 animate-spin text-amber-700 shrink-0" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Drag & Drop Menu Import Area */}
      <div
        onDragOver={handleMenuDragOver}
        onDragLeave={handleMenuDragLeave}
        onDrop={handleMenuDrop}
        className={`rounded-2xl border-2 border-dashed transition-all ${
          isDraggingMenuFiles
            ? 'border-terracotta bg-terracotta-50/40 shadow-sm'
            : 'border-cream-300 bg-white/80 hover:border-cream-400'
        } ${menuItems.length === 0 && !secondaryLoadingItems ? 'p-6 sm:p-8 text-center' : 'px-4 py-3'}`}
      >
        {menuItems.length === 0 && !secondaryLoadingItems ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-terracotta flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-900">
                Import Your Menu from Photos or a PDF
              </h3>
              <p className="text-xs sm:text-sm text-taupe-600 mt-1">
                Drag &amp; drop menu files here, or pick either <strong className="text-espresso-800">menu photos</strong> (JPG, PNG, WebP, HEIC — multiple pages OK) or a <strong className="text-espresso-800">menu PDF</strong> (up to 20 MB).
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                disabled={isUploadingMenu}
                onClick={() => menuPhotoInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-colors inline-flex items-center gap-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <Camera className="w-4 h-4 text-terracotta" />
                <span>Upload Menu Photos</span>
              </button>
              <button
                type="button"
                disabled={isUploadingMenu}
                onClick={() => menuPdfInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-cream-100 border border-cream-300 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-200 disabled:opacity-50 transition-colors inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <FileText className="w-4 h-4 text-terracotta" />
                <span>Upload Menu PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-taupe-600">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-terracotta shrink-0" />
              <span>
                Drag &amp; drop more <strong className="text-espresso-800">menu photos</strong> or a <strong className="text-espresso-800">PDF</strong> here to append additional pages (existing dishes won&apos;t be duplicated).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isUploadingMenu}
                onClick={() => menuPhotoInputRef.current?.click()}
                className="font-semibold text-espresso-800 hover:text-terracotta underline-offset-2 hover:underline disabled:opacity-50"
              >
                Browse Photos
              </button>
              <span className="text-cream-400">|</span>
              <button
                type="button"
                disabled={isUploadingMenu}
                onClick={() => menuPdfInputRef.current?.click()}
                className="font-semibold text-espresso-800 hover:text-terracotta underline-offset-2 hover:underline disabled:opacity-50"
              >
                Browse PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dishes Data Table */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-soft overflow-hidden">
        <div className="p-3.5 border-b border-cream-200 bg-cream-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMenuFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              menuFilter === 'ALL'
                ? 'bg-espresso-900 text-white shadow-sm'
                : 'bg-white border border-cream-200 text-taupe-600 hover:bg-cream-100'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>

          <button
            onClick={() => setMenuFilter('POPULAR')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              menuFilter === 'POPULAR'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-white border border-cream-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Popular &amp; Bestsellers (
            {menuItems.filter((i) => i.isPopular || i.chefRecommended).length})
          </button>

          {isIndianRestaurant ? (
            <>
              <button
                onClick={() => setMenuFilter('VEG')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  menuFilter === 'VEG'
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'bg-white border border-cream-200 text-green-800 hover:bg-green-50'
                }`}
              >
                <FssaiMarker type="VEG" /> Pure Veg
              </button>
              <button
                onClick={() => setMenuFilter('NON_VEG')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  menuFilter === 'NON_VEG'
                    ? 'bg-[#7B3F00] text-white shadow-sm'
                    : 'bg-white border border-cream-200 text-[#7B3F00] hover:bg-amber-50'
                }`}
              >
                <FssaiMarker type="NON_VEG" /> Non-Veg
              </button>
              <button
                onClick={() => setMenuFilter('EGG')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  menuFilter === 'EGG'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white border border-cream-200 text-amber-800 hover:bg-yellow-50'
                }`}
              >
                <FssaiMarker type="EGG" /> Contains Egg
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMenuFilter('VEGAN')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  menuFilter === 'VEGAN'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white border border-cream-200 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Vegan
              </button>
              <button
                onClick={() => setMenuFilter('GLUTEN_FREE')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  menuFilter === 'GLUTEN_FREE'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-white border border-cream-200 text-amber-800 hover:bg-amber-50'
                }`}
              >
                Gluten-Free
              </button>
            </>
          )}
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
            <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Dish Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Spotlight Tags</th>
                <th className="py-3.5 px-4 text-center">Availability</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {secondaryLoadingItems && menuItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-xs text-taupe-500">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-terracotta" />
                      Loading menu dishes...
                    </span>
                  </td>
                </tr>
              )}
              {menuItems
                .filter((item) => {
                  if (menuFilter === 'POPULAR') return Boolean(item.isPopular || item.chefRecommended);
                  if (menuFilter === 'VEG') {
                    const labels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                      l.toUpperCase()
                    );
                    return labels.includes('VEG') || labels.includes('VEGETARIAN') || labels.includes('PURE_VEG');
                  }
                  if (menuFilter === 'NON_VEG') {
                    const labels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                      l.toUpperCase()
                    );
                    return labels.includes('NON_VEG') || labels.includes('NON-VEG') || labels.includes('NONVEG');
                  }
                  if (menuFilter === 'EGG') {
                    const labels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                      l.toUpperCase()
                    );
                    return labels.includes('EGG') || labels.includes('CONTAINS_EGG') || labels.includes('EGGETARIAN');
                  }
                  if (menuFilter === 'VEGAN') {
                    const labels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                      l.toUpperCase()
                    );
                    return labels.includes('VEGAN');
                  }
                  if (menuFilter === 'GLUTEN_FREE') {
                    const labels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                      l.toUpperCase()
                    );
                    return labels.includes('GLUTEN_FREE') || labels.includes('GF');
                  }
                  return true;
                })
                .map((item) => {
                  const imageMeta = resolveDishImageMeta(item);
                  const dietaryLabels = ((item.dietaryStatus as string[]) || []).map((l: string) =>
                    l.toUpperCase()
                  );
                  const isVeg = dietaryLabels.some((l) =>
                    ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(l)
                  );
                  const isNonVeg = dietaryLabels.some((l) =>
                    ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l)
                  );
                  const isEgg = dietaryLabels.some((l) =>
                    ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l)
                  );
                  const indianMarker = isVeg ? 'VEG' : isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : null;

                  return (
                    <tr key={item.id} className="hover:bg-cream-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setPreviewDishId(item.id)}
                          aria-label={`Preview ${item.customName}`}
                          className="group flex items-center gap-3 w-full text-left rounded-xl p-1 -m-1 hover:bg-cream-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta cursor-pointer"
                        >
                          <span className="relative w-12 h-12 aspect-square rounded-xl overflow-hidden bg-cream-100 border border-cream-200 shrink-0">
                            <img
                              src={imageMeta.url}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-dish.svg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 bg-espresso-950/45 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              {indianMarker && <FssaiMarker type={indianMarker} size="sm" />}
                              <span className="font-semibold text-espresso-900 group-hover:text-terracotta transition-colors truncate">
                                {item.customName}
                              </span>
                              {imageMeta.sourceKind === 'OWNER_PHOTO' && (
                                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                                  Photo
                                </span>
                              )}
                            </span>
                            {item.restaurantDescription && (
                              <span className="block text-[11px] text-taupe-500 line-clamp-1 max-w-xs">
                                {item.restaurantDescription}
                              </span>
                            )}
                          </span>
                        </button>
                      </td>
                      <td
                        onClick={() => setPreviewDishId(item.id)}
                        className="py-3.5 px-4 text-taupe-600 font-medium cursor-pointer"
                      >
                        {item.category?.name || 'General'}
                      </td>
                      <td
                        onClick={() => setPreviewDishId(item.id)}
                        className="py-3.5 px-4 font-bold text-espresso-900 cursor-pointer tabular-nums"
                      >
                        {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePopular(item)}
                            aria-label={
                              item.isPopular
                                ? `Remove Popular tag from ${item.customName}`
                                : `Mark ${item.customName} as Popular`
                            }
                            title={
                              item.isPopular
                                ? 'Remove from Bestsellers'
                                : 'Mark as Popular / Bestseller'
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta ${
                              item.isPopular
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                                : 'bg-cream-100 text-taupe-400 border border-cream-200 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <Flame
                              className={`w-3.5 h-3.5 ${
                                item.isPopular ? 'text-rose-600' : 'text-taupe-400'
                              }`}
                            />
                            <span className="hidden sm:inline">Popular</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleChefPick(item)}
                            aria-label={
                              item.chefRecommended
                                ? `Remove Chef Pick from ${item.customName}`
                                : `Mark ${item.customName} as Chef Pick`
                            }
                            title={
                              item.chefRecommended
                                ? 'Remove Chef Pick'
                                : "Mark as Chef's Recommendation"
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta ${
                              item.chefRecommended
                                ? 'bg-terracotta-100 text-terracotta-800 border border-terracotta-300 shadow-2xs'
                                : 'bg-cream-100 text-taupe-400 border border-cream-200 hover:text-terracotta hover:bg-terracotta-50'
                            }`}
                          >
                            <Sparkles
                              className={`w-3.5 h-3.5 ${
                                item.chefRecommended ? 'text-terracotta-600' : 'text-taupe-400'
                              }`}
                            />
                            <span className="hidden sm:inline">Chef Pick</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta ${
                            item.isAvailable
                              ? 'bg-sage-100 text-sage-800 hover:bg-sage-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDishId(item.id)}
                            className="p-2 text-taupe-600 hover:text-espresso-900 hover:bg-cream-100 transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                            title="Preview dish & manage image"
                            aria-label={`Preview ${item.customName}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRowPhotoClick(item.id)}
                            disabled={uploadingQuickDishId === item.id}
                            className="p-2 text-taupe-600 hover:text-espresso-900 hover:bg-cream-100 transition-colors rounded-lg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                            title="Upload your own dish photo"
                            aria-label={`Upload own photo for ${item.customName}`}
                          >
                            {uploadingQuickDishId === item.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-terracotta" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateIllustration(item)}
                            disabled={isGeneratingImg === item.id}
                            className="p-2 text-terracotta hover:bg-terracotta-50 transition-colors rounded-lg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                            title="Generate / Regenerate AI Food Photo (Accept/Reject Preview)"
                            aria-label={`Regenerate AI food photo for ${item.customName}`}
                          >
                            {isGeneratingImg === item.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-terracotta" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDish(item)}
                            className="p-2 text-taupe-600 hover:text-espresso-900 transition-colors rounded-lg hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                            title="Edit dish name, price & description"
                            aria-label={`Edit ${item.customName}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDeleteDish(item)}
                            className="p-2 text-taupe-400 hover:text-red-600 transition-colors rounded-lg hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                            title="Delete dish"
                            aria-label={`Delete ${item.customName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL A: EDIT DISH DETAILS */}
      <Modal
        isOpen={Boolean(isEditDishOpen && activeEditingDish)}
        onClose={() => {
          setIsEditDishOpen(false);
          setEditDishError(null);
        }}
        title="Edit Dish Details"
        subtitle={
          activeEditingDish
            ? `Update name, photo, pricing, dietary tags, and description for ${activeEditingDish.customName}`
            : undefined
        }
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsEditDishOpen(false);
                setEditDishError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-taupe-600 hover:bg-cream-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-dish-form"
              disabled={isSavingEdit || editPhotoBusy}
              className="px-5 py-2 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 disabled:opacity-50 shadow-sm"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {activeEditingDish && (() => {
          const editImgMeta = resolveDishImageMeta(activeEditingDish);
          return (
            <form id="edit-dish-form" onSubmit={handleSaveEditedDish} className="space-y-4">
              {editDishError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  {editDishError}
                </div>
              )}

              {/* Dish Photo & Artwork Quick Editor */}
              <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 flex flex-col sm:flex-row sm:items-center gap-3.5">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-cream-200 shrink-0 shadow-2xs">
                  <img
                    src={editImgMeta.url}
                    alt={activeEditingDish.customName}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-dish.svg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  {editPhotoBusy && (
                    <div className="absolute inset-0 bg-espresso-950/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-espresso-900">
                      Dish Image &amp; Artwork
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-cream-300 text-taupe-700">
                      {editImgMeta.label}
                    </span>
                  </div>

                  <label htmlFor={editPhotoInputId} className="sr-only">
                    Upload photo for {activeEditingDish.customName}
                  </label>
                  <input
                    id={editPhotoInputId}
                    ref={editPhotoInputRef}
                    type="file"
                    accept={DISH_PHOTO_ACCEPT}
                    disabled={editPhotoBusy}
                    onChange={handleEditModalPhotoChange}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={editPhotoBusy || isGeneratingImg === activeEditingDish.id}
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-terracotta" aria-hidden="true" />
                      Upload Own Photo
                    </button>

                    <button
                      type="button"
                      disabled={editPhotoBusy || isGeneratingImg === activeEditingDish.id}
                      onClick={() => {
                        setGalleryTargetDishId(activeEditingDish.id);
                        setIsGalleryOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-cream-100 text-espresso-900 border border-cream-300 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-sage-700" aria-hidden="true" />
                      Gallery
                    </button>

                    <button
                      type="button"
                      disabled={editPhotoBusy || isGeneratingImg === activeEditingDish.id}
                      onClick={async () => {
                        setEditDishError(null);
                        try {
                          await handleGenerateIllustration(activeEditingDish, undefined, {
                            throwOnError: true,
                          });
                        } catch (err: any) {
                          setEditDishError(err?.message || 'Could not generate food photo right now.');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-800 border border-terracotta-200 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      {isGeneratingImg === activeEditingDish.id ? 'Generating...' : 'Regenerate AI'}
                    </button>

                    {editImgMeta.hasCustomOverride && (
                      <button
                        type="button"
                        disabled={editPhotoBusy}
                        onClick={handleEditModalRevertPhoto}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-taupe-700 hover:text-red-700 border border-cream-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        Revert
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={editNameId} className="block text-xs font-semibold text-taupe-600 mb-1">
                    Dish Name *
                  </label>
                  <input
                    id={editNameId}
                    type="text"
                    required
                    value={editDishName}
                    onChange={(e) => setEditDishName(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label htmlFor={editCategoryId} className="block text-xs font-semibold text-taupe-600 mb-1">
                    Category
                  </label>
                  <select
                    id={editCategoryId}
                    value={editDishCategory}
                    onChange={(e) => setEditDishCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                  >
                    <option value="">Default / General</option>
                    {existingCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={editPriceId} className="block text-xs font-semibold text-taupe-600 mb-1">
                  Price ({restaurant.currency}) *
                </label>
                <input
                  id={editPriceId}
                  type="number"
                  required
                  step="0.01"
                  value={editDishPrice}
                  onChange={(e) => setEditDishPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>

              <div>
                <label htmlFor={editDescId} className="block text-xs font-semibold text-taupe-600 mb-1">
                  Description / Recipe
                </label>
                <textarea
                  id={editDescId}
                  rows={2}
                  value={editDishDescription}
                  onChange={(e) => setEditDishDescription(e.target.value)}
                  placeholder="Key spices, preparation technique, portion size..."
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>

            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
              <span className="block text-xs font-semibold text-espresso-900">
                Menu Spotlight Options
              </span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                  <input
                    type="checkbox"
                    checked={editDishIsPopular}
                    onChange={(e) => setEditDishIsPopular(e.target.checked)}
                    className="rounded border-cream-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <strong>Popular / Bestseller</strong>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                  <input
                    type="checkbox"
                    checked={editDishChefRecommended}
                    onChange={(e) => setEditDishChefRecommended(e.target.checked)}
                    className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                    <strong>Chef&apos;s Pick</strong>
                  </span>
                </label>
              </div>
            </div>

            {isIndianRestaurant ? (
              <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-2">
                    Indian Food Classification (FSSAI) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDishFoodType('VEG')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        editDishFoodType === 'VEG'
                          ? 'bg-green-100 border-green-600 text-green-900 ring-2 ring-green-500/20'
                          : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                      }`}
                    >
                      <FssaiMarker type="VEG" /> Pure Veg
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditDishFoodType('NON_VEG')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        editDishFoodType === 'NON_VEG'
                          ? 'bg-amber-100 border-[#7B3F00] text-[#7B3F00] ring-2 ring-amber-500/20'
                          : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                      }`}
                    >
                      <FssaiMarker type="NON_VEG" /> Non-Veg
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditDishFoodType('EGG')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        editDishFoodType === 'EGG'
                          ? 'bg-yellow-100 border-amber-500 text-amber-900 ring-2 ring-yellow-500/20'
                          : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                      }`}
                    >
                      <FssaiMarker type="EGG" /> Contains Egg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-taupe-600 mb-1">
                    Additional Options
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'JAIN', label: 'Jain Safe (No Onion/Garlic)' },
                      { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                      { key: 'VEGAN', label: 'Vegan' },
                    ].map((tag) => {
                      const checked = editDishDietaryTags.includes(tag.key);
                      return (
                        <button
                          type="button"
                          key={tag.key}
                          onClick={() => {
                            setEditDishDietaryTags((prev) =>
                              checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            checked
                              ? 'bg-espresso-900 text-white border-espresso-900'
                              : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                          }`}
                        >
                          {checked ? '✓ ' : '+ '} {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  Dietary Suitability &amp; Allergens (Abroad)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'VEGETARIAN', label: 'Vegetarian' },
                    { key: 'VEGAN', label: 'Vegan' },
                    { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                    { key: 'DAIRY_FREE', label: 'Dairy-Free' },
                    { key: 'NUT_FREE', label: 'Nut-Free' },
                    { key: 'HALAL', label: 'Halal' },
                    { key: 'KOSHER', label: 'Kosher' },
                  ].map((tag) => {
                    const checked = editDishDietaryTags.includes(tag.key);
                    return (
                      <button
                        type="button"
                        key={tag.key}
                        onClick={() => {
                          setEditDishDietaryTags((prev) =>
                            checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          checked
                            ? 'bg-espresso-900 text-white border-espresso-900'
                            : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '} {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
          );
        })()}
      </Modal>

      {/* MODAL B: ADD NEW DISH */}
      <Modal
        isOpen={isAddDishOpen}
        onClose={() => {
          setIsAddDishOpen(false);
          setAddDishError(null);
          setNewDishPhotoFile(null);
        }}
        title="Add New Dish"
        subtitle={isIndianRestaurant ? 'Indian Restaurant Menu Item' : 'Hospitality Menu Item'}
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsAddDishOpen(false);
                setAddDishError(null);
                setNewDishPhotoFile(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-taupe-600 hover:bg-cream-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-dish-form"
              disabled={isAddingDish}
              className="px-5 py-2 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 disabled:opacity-50 shadow-sm inline-flex items-center gap-1.5"
            >
              {isAddingDish && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
              )}
              <span>{isAddingDish ? 'Saving Dish...' : 'Save Dish to Menu'}</span>
            </button>
          </>
        }
      >
        <form id="add-dish-form" onSubmit={handleAddDish} className="space-y-4">
          {addDishError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {addDishError}
            </div>
          )}

          {/* Optional Own Dish Photo Uploader */}
          <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-cream-300 shrink-0 flex items-center justify-center">
              {newDishPhotoPreviewUrl ? (
                <img
                  src={newDishPhotoPreviewUrl}
                  alt="Selected dish photo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-taupe-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-xs font-semibold text-espresso-900">
                Dish Photo (Optional)
              </div>
              <p className="text-[11px] text-taupe-500 truncate">
                {newDishPhotoFile
                  ? newDishPhotoFile.name
                  : 'Upload your own photo, or leave blank to auto-match a 3D dish visual.'}
              </p>
              <label htmlFor={addPhotoInputId} className="sr-only">
                Upload optional photo for new dish
              </label>
              <input
                id={addPhotoInputId}
                ref={addPhotoInputRef}
                type="file"
                accept={DISH_PHOTO_ACCEPT}
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setNewDishPhotoFile(picked);
                }}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addPhotoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 text-[11px] font-semibold text-espresso-900 transition-colors inline-flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 text-terracotta" aria-hidden="true" />
                  {newDishPhotoFile ? 'Change Photo' : 'Choose Photo'}
                </button>
                {newDishPhotoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewDishPhotoFile(null);
                      if (addPhotoInputRef.current) {
                        addPhotoInputRef.current.value = '';
                      }
                    }}
                    className="px-2 py-1 rounded-xl text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={addNameId} className="block text-xs font-semibold text-taupe-600 mb-1">
                Dish Name *
              </label>
              <input
                id={addNameId}
                type="text"
                required
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                placeholder={isIndianRestaurant ? 'e.g. Paneer Butter Masala' : 'e.g. Truffle Pappardelle'}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label htmlFor={addCategoryId} className="block text-xs font-semibold text-taupe-600 mb-1">
                Category
              </label>
              <select
                id={addCategoryId}
                value={newDishCategory}
                onChange={(e) => setNewDishCategory(e.target.value)}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
              >
                <option value="">Default / Chef Specials</option>
                {existingCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={addPriceId} className="block text-xs font-semibold text-taupe-600 mb-1">
              Price ({restaurant.currency}) *
            </label>
            <input
              id={addPriceId}
              type="number"
              required
              step="0.01"
              value={newDishPrice}
              onChange={(e) => setNewDishPrice(e.target.value)}
              className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label htmlFor={addDescId} className="block text-xs font-semibold text-taupe-600 mb-1">
              Description / Recipe
            </label>
            <textarea
              id={addDescId}
              rows={2}
              value={newDishDescription}
              onChange={(e) => setNewDishDescription(e.target.value)}
              placeholder="Key spices, preparation technique, portion size..."
              className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <span className="block text-xs font-semibold text-espresso-900">
              Menu Spotlight Options
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                <input
                  type="checkbox"
                  checked={newDishIsPopular}
                  onChange={(e) => setNewDishIsPopular(e.target.checked)}
                  className="rounded border-cream-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <strong>Popular / Bestseller</strong>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                <input
                  type="checkbox"
                  checked={newDishChefRecommended}
                  onChange={(e) => setNewDishChefRecommended(e.target.checked)}
                  className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                  <strong>Chef&apos;s Pick</strong>
                </span>
              </label>
            </div>
          </div>

          {isIndianRestaurant ? (
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-2">
                  Indian Food Classification (FSSAI) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDishFoodType('VEG')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newDishFoodType === 'VEG'
                        ? 'bg-green-100 border-green-600 text-green-900 ring-2 ring-green-500/20'
                        : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                    }`}
                  >
                    <FssaiMarker type="VEG" /> Pure Veg
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDishFoodType('NON_VEG')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newDishFoodType === 'NON_VEG'
                        ? 'bg-amber-100 border-[#7B3F00] text-[#7B3F00] ring-2 ring-amber-500/20'
                        : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                    }`}
                  >
                    <FssaiMarker type="NON_VEG" /> Non-Veg
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDishFoodType('EGG')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newDishFoodType === 'EGG'
                        ? 'bg-yellow-100 border-amber-500 text-amber-900 ring-2 ring-yellow-500/20'
                        : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                    }`}
                  >
                    <FssaiMarker type="EGG" /> Contains Egg
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-taupe-600 mb-1">
                  Additional Options
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'JAIN', label: 'Jain Safe (No Onion/Garlic)' },
                    { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                    { key: 'VEGAN', label: 'Vegan' },
                  ].map((tag) => {
                    const checked = newDishDietaryTags.includes(tag.key);
                    return (
                      <button
                        type="button"
                        key={tag.key}
                        onClick={() => {
                          setNewDishDietaryTags((prev) =>
                            checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          checked
                            ? 'bg-espresso-900 text-white border-espresso-900'
                            : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '} {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
              <label className="block text-xs font-semibold text-espresso-900 mb-1">
                Dietary Suitability &amp; Allergens (Abroad)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'VEGETARIAN', label: 'Vegetarian' },
                  { key: 'VEGAN', label: 'Vegan' },
                  { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                  { key: 'DAIRY_FREE', label: 'Dairy-Free' },
                  { key: 'NUT_FREE', label: 'Nut-Free' },
                  { key: 'HALAL', label: 'Halal' },
                  { key: 'KOSHER', label: 'Kosher' },
                ].map((tag) => {
                  const checked = newDishDietaryTags.includes(tag.key);
                  return (
                    <button
                      type="button"
                      key={tag.key}
                      onClick={() => {
                        setNewDishDietaryTags((prev) =>
                          checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        checked
                          ? 'bg-espresso-900 text-white border-espresso-900'
                          : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* MODAL: ON-SCREEN DELETE DISH CONFIRMATION */}
      <Modal
        isOpen={Boolean(isDeleteDialogOpen && dishToDelete)}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDishToDelete(null);
        }}
        ariaLabel="Remove Dish from Menu?"
        showCloseButton={false}
        maxWidth="md"
        bodyClassName="text-center space-y-4"
      >
        {dishToDelete && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-bold text-espresso-900">
                Remove Dish from Menu?
              </h3>
              <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                Are you sure you want to remove{' '}
                <strong className="text-espresso-900 font-semibold">
                  &quot;{dishToDelete.customName}&quot;
                </strong>
                ? This will instantly remove it from your live visual menu and diner QR experience.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDishToDelete(null);
                }}
                disabled={isDeletingDish}
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-taupe-700 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteDish}
                disabled={isDeletingDish}
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingDish ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeletingDish ? 'Removing...' : 'Yes, Remove Dish'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <DishPreviewModal
        dish={previewDish}
        isOpen={Boolean(previewDish)}
        onClose={() => setPreviewDishId(null)}
        restaurantId={restaurant.id}
        isGeneratingImg={isGeneratingImg}
        onDishUpdated={syncUpdatedDish}
        onRegenerateImage={(item, tweak) =>
          handleGenerateIllustration(item, tweak, { throwOnError: true })
        }
        onOpenGallery={(item) => {
          setGalleryTargetDishId(item.id);
          setIsGalleryOpen(true);
        }}
        onEditDish={handleOpenEditDish}
        onSubscriptionExpired={onSubscriptionExpired}
      />

      <CanonicalGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        restaurantId={restaurant.id}
        menuItems={menuItems}
        targetDishId={galleryTargetDishId}
        onTargetDishIdChange={setGalleryTargetDishId}
        onApplied={(updatedItem) => {
          syncUpdatedDish(updatedItem);
          showPhotoNotice(`Applied Canonical Gallery artwork to "${updatedItem.customName}".`);
        }}
        onSubscriptionExpired={onSubscriptionExpired}
      />

      <CandidateReviewModal
        restaurantId={restaurant.id}
        candidateReview={candidateReview}
        setCandidateReview={setCandidateReview}
        isGeneratingImg={isGeneratingImg}
        onRetryGenerate={(item, tweak) =>
          handleGenerateIllustration(item, tweak, { throwOnError: true })
        }
        onApplied={(itemId, asset) => {
          setMenuItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, imageOverride: asset, imageOverrideAssetId: asset.id } : i
            )
          );
          showPhotoNotice('Applied generated food photo to dish.');
        }}
        onSubscriptionExpired={onSubscriptionExpired}
      />
    </div>
  );
}

