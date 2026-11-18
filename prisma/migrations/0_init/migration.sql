-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThemePreset" AS ENUM ('WARM_EDITORIAL', 'MIDNIGHT_ESPRESSO', 'BOTANICAL_CAFE', 'PASTEL_PATISSERIE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LayoutMode" AS ENUM ('GRID', 'LIST');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('ALL_DAY', 'LUNCH', 'DINNER', 'BREAKFAST', 'DRINKS', 'DESSERT', 'SEASONAL');

-- CreateEnum
CREATE TYPE "MenuVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "NutritionSource" AS ENUM ('NOT_PROVIDED', 'AI_ESTIMATED', 'RESTAURANT_PROVIDED', 'RESTAURANT_VERIFIED');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ORIGINAL_MENU', 'OWNER_PHOTO', 'AI_ILLUSTRATION', 'QR_CODE', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('UNREVIEWED', 'REVIEWED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('TRIAL', 'STARTER', 'GROWTH', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'TRIAL', 'PENDING', 'ACTIVE', 'PAST_DUE', 'CANCEL_AT_PERIOD_END', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GrantType" AS ENUM ('COMPLIMENTARY_PLAN', 'BONUS_IMAGE_CREDITS', 'BONUS_AI_QUESTIONS', 'EXTENSION');

-- CreateEnum
CREATE TYPE "AIOperationType" AS ENUM ('MENU_EXTRACTION', 'CANONICAL_MATCH', 'IMAGE_GENERATION', 'IMAGE_REGENERATION', 'DINER_CHAT', 'OTHER_AI_OPERATION');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('UNCLAIMED', 'RESERVED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'KITCHEN', 'WAITER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderActorType" AS ENUM ('STAFF', 'DINER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CustomerLedgerType" AS ENUM ('CREDIT_ADDED', 'PAYMENT_RECEIVED', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "billingCountry" TEXT NOT NULL DEFAULT 'IN',
    "billingCurrency" TEXT NOT NULL DEFAULT 'INR',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "googleReviewUrl" TEXT,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'DRAFT',
    "isClaimed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "welcomeMessage" TEXT DEFAULT 'Welcome! Explore our dishes or ask our AI waiter anything.',
    "aiTone" TEXT DEFAULT 'warm, knowledgeable, concise, hospitality-focused',
    "allowDinerChat" BOOLEAN NOT NULL DEFAULT true,
    "allowPairings" BOOLEAN NOT NULL DEFAULT true,
    "maxDinerChatPerSession" INTEGER NOT NULL DEFAULT 25,
    "featuredDishIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTheme" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "presetKey" "ThemePreset" NOT NULL DEFAULT 'WARM_EDITORIAL',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F7F3EC',
    "surfaceColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "primaryTextColor" TEXT NOT NULL DEFAULT '#35271F',
    "secondaryTextColor" TEXT NOT NULL DEFAULT '#7C695C',
    "accentColor" TEXT NOT NULL DEFAULT '#B86D52',
    "secondaryAccentColor" TEXT NOT NULL DEFAULT '#70816B',
    "headingFont" TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
    "bodyFont" TEXT NOT NULL DEFAULT 'Inter',
    "layoutMode" "LayoutMode" NOT NULL DEFAULT 'GRID',
    "cardRadius" TEXT NOT NULL DEFAULT '16px',
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "imageProportions" TEXT NOT NULL DEFAULT 'square',
    "texture" TEXT NOT NULL DEFAULT 'none',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "draftSettings" JSONB,
    "publishedSettings" JSONB,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT DEFAULT 'Main Dining',
    "capacity" INTEGER DEFAULT 4,
    "qrTokenHash" TEXT NOT NULL,
    "qrVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Main Menu',
    "type" "MenuType" NOT NULL DEFAULT 'ALL_DAY',
    "visibility" "MenuVisibility" NOT NULL DEFAULT 'PUBLIC',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "schedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantMenuItem" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "canonicalId" TEXT,
    "customName" TEXT NOT NULL,
    "restaurantDescription" TEXT,
    "priceMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "preparationDetails" TEXT,
    "portionSize" TEXT,
    "ingredients" JSONB,
    "dietaryStatus" JSONB,
    "allergenVerification" JSONB,
    "nutritionFields" JSONB,
    "nutritionSource" "NutritionSource" NOT NULL DEFAULT 'NOT_PROVIDED',
    "imageOverrideAssetId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "chefRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishVariant" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "choiceGroup" TEXT NOT NULL DEFAULT 'Size',
    "supplementalPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalDish" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliases" JSONB,
    "cuisine" TEXT,
    "generalizedDescription" TEXT,
    "estimatedNutrition" JSONB,
    "imageAssetId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reviewState" "ReviewState" NOT NULL DEFAULT 'APPROVED',
    "provenance" TEXT DEFAULT 'SYSTEM_CURATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalDish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalAlias" (
    "id" TEXT NOT NULL,
    "canonicalId" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "cuisineContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalAsset" (
    "id" TEXT NOT NULL,
    "canonicalId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'AI_ILLUSTRATION',
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'image/webp',
    "width" INTEGER,
    "height" INTEGER,
    "ownerOrganizationId" TEXT,
    "canonicalId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'GEMINI_GEN',
    "prompt" TEXT,
    "generationModel" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuUpload" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "fileKeys" JSONB NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "errorDetails" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "extractedJson" JSONB,
    "extractionConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "canonicalId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "prompt" TEXT NOT NULL,
    "outputAssetId" TEXT,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "itemLimit" INTEGER NOT NULL,
    "imageCreditsMonthly" INTEGER NOT NULL,
    "aiQuestionsMonthly" INTEGER NOT NULL,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "planKey" TEXT NOT NULL,
    "providerSubscriptionId" TEXT,
    "providerCustomerId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "paidThrough" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementGrant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "grantType" "GrantType" NOT NULL,
    "tierOrValue" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "founderReason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntitlementGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "creditType" TEXT NOT NULL DEFAULT 'IMAGE_GENERATION',
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "generationJobId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "restaurantId" TEXT,
    "operationType" "AIOperationType" NOT NULL,
    "modelId" TEXT NOT NULL,
    "requestId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "billingPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyUsageSummary" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyUsageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostRateVersion" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokenRatePerMillion" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "outputTokenRatePerMillion" DOUBLE PRECISION NOT NULL DEFAULT 0.60,
    "imageRatePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostRateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitPolicy" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "maxRequests" INTEGER NOT NULL DEFAULT 25,
    "windowSeconds" INTEGER NOT NULL DEFAULT 300,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DinerSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DinerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recommendedDishIds" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT,
    "sessionToken" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishInteractionEvent" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishInteractionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimRequest" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "claimTokenHash" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "claimantUserId" TEXT,
    "claimantEmail" TEXT,
    "verificationNotes" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantStaff" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'KITCHEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "dinerSessionId" TEXT,
    "customerId" TEXT,
    "customerNameSnapshot" TEXT,
    "customerMobileSnapshot" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotalMinor" INTEGER NOT NULL,
    "taxMinor" INTEGER NOT NULL DEFAULT 0,
    "serviceChargeMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "paidMinor" INTEGER NOT NULL DEFAULT 0,
    "dueMinor" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PAY_AT_COUNTER',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "specialInstructions" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "preparingAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "restaurantMenuItemId" TEXT,
    "dishNameSnapshot" TEXT NOT NULL,
    "variantSnapshot" TEXT,
    "modifierSnapshot" JSONB,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceMinor" INTEGER NOT NULL,
    "modifiersTotalMinor" INTEGER NOT NULL DEFAULT 0,
    "lineTotalMinor" INTEGER NOT NULL,
    "specialInstructions" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "changedByStaffId" TEXT,
    "actorType" "OrderActorType" NOT NULL DEFAULT 'STAFF',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuModifierGroup" (
    "id" TEXT NOT NULL,
    "restaurantMenuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuModifierOption" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantOrderingSettings" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "acceptsNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "orderingHours" JSONB,
    "allowSpecialInstructions" BOOLEAN NOT NULL DEFAULT true,
    "paymentMode" TEXT NOT NULL DEFAULT 'PAY_AT_COUNTER',
    "notificationSettings" JSONB,
    "maxActiveOrders" INTEGER NOT NULL DEFAULT 50,
    "autoRejectWhenClosed" BOOLEAN NOT NULL DEFAULT false,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "serviceChargePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customerCreditEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantOrderingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "creditBalanceMinor" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditLedger" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "CustomerLedgerType" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "balanceAfterMinor" INTEGER NOT NULL,
    "note" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableServiceCall" (
    "id" VARCHAR(64) NOT NULL,
    "restaurantId" VARCHAR(64) NOT NULL,
    "tableId" VARCHAR(64) NOT NULL,
    "tableName" VARCHAR(128) NOT NULL,
    "tableSection" VARCHAR(128),
    "callType" VARCHAR(32) NOT NULL DEFAULT 'ASSISTANCE',
    "notes" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendedAt" TIMESTAMPTZ(6),
    "attendedBy" VARCHAR(128),

    CONSTRAINT "TableServiceCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE INDEX "Restaurant_organizationId_idx" ON "Restaurant"("organizationId");

-- CreateIndex
CREATE INDEX "Restaurant_slug_idx" ON "Restaurant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettings_restaurantId_key" ON "RestaurantSettings"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTheme_restaurantId_key" ON "RestaurantTheme"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_qrTokenHash_key" ON "RestaurantTable"("qrTokenHash");

-- CreateIndex
CREATE INDEX "RestaurantTable_restaurantId_idx" ON "RestaurantTable"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantTable_restaurantId_isArchived_isActive_idx" ON "RestaurantTable"("restaurantId", "isArchived", "isActive");

-- CreateIndex
CREATE INDEX "RestaurantTable_qrTokenHash_idx" ON "RestaurantTable"("qrTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_restaurantId_name_key" ON "RestaurantTable"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "Menu_restaurantId_idx" ON "Menu"("restaurantId");

-- CreateIndex
CREATE INDEX "Menu_restaurantId_active_sortOrder_idx" ON "Menu"("restaurantId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuCategory_menuId_idx" ON "MenuCategory"("menuId");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_restaurantId_idx" ON "RestaurantMenuItem"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_restaurantId_isPublished_sortOrder_idx" ON "RestaurantMenuItem"("restaurantId", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_restaurantId_isPublished_isAvailable_sor_idx" ON "RestaurantMenuItem"("restaurantId", "isPublished", "isAvailable", "sortOrder");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_menuId_idx" ON "RestaurantMenuItem"("menuId");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_categoryId_idx" ON "RestaurantMenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_categoryId_isPublished_sortOrder_idx" ON "RestaurantMenuItem"("categoryId", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "RestaurantMenuItem_canonicalId_idx" ON "RestaurantMenuItem"("canonicalId");

-- CreateIndex
CREATE INDEX "DishVariant_menuItemId_idx" ON "DishVariant"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalDish_normalizedName_key" ON "CanonicalDish"("normalizedName");

-- CreateIndex
CREATE INDEX "CanonicalDish_normalizedName_idx" ON "CanonicalDish"("normalizedName");

-- CreateIndex
CREATE INDEX "CanonicalAlias_normalizedAlias_idx" ON "CanonicalAlias"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalAlias_canonicalId_normalizedAlias_key" ON "CanonicalAlias"("canonicalId", "normalizedAlias");

-- CreateIndex
CREATE INDEX "CanonicalAsset_canonicalId_idx" ON "CanonicalAsset"("canonicalId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalAsset_canonicalId_assetId_key" ON "CanonicalAsset"("canonicalId", "assetId");

-- CreateIndex
CREATE INDEX "Asset_ownerOrganizationId_idx" ON "Asset"("ownerOrganizationId");

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateIndex
CREATE INDEX "AssetVersion_assetId_idx" ON "AssetVersion"("assetId");

-- CreateIndex
CREATE INDEX "MenuUpload_restaurantId_idx" ON "MenuUpload"("restaurantId");

-- CreateIndex
CREATE INDEX "ExtractionJob_uploadId_idx" ON "ExtractionJob"("uploadId");

-- CreateIndex
CREATE INDEX "ExtractionJob_restaurantId_idx" ON "ExtractionJob"("restaurantId");

-- CreateIndex
CREATE INDEX "ExtractionJob_restaurantId_createdAt_idx" ON "ExtractionJob"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractionJob_status_createdAt_idx" ON "ExtractionJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_restaurantId_idx" ON "GenerationJob"("restaurantId");

-- CreateIndex
CREATE INDEX "GenerationJob_restaurantId_status_createdAt_idx" ON "GenerationJob"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_status_createdAt_idx" ON "GenerationJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_menuItemId_idx" ON "GenerationJob"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_providerSubscriptionId_idx" ON "Subscription"("providerSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_providerEventId_idx" ON "BillingEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EntitlementGrant_organizationId_idx" ON "EntitlementGrant"("organizationId");

-- CreateIndex
CREATE INDEX "EntitlementGrant_organizationId_isActive_expirationDate_idx" ON "EntitlementGrant"("organizationId", "isActive", "expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedger_idempotencyKey_key" ON "CreditLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CreditLedger_organizationId_idx" ON "CreditLedger"("organizationId");

-- CreateIndex
CREATE INDEX "CreditLedger_organizationId_creditType_timestamp_idx" ON "CreditLedger"("organizationId", "creditType", "timestamp");

-- CreateIndex
CREATE INDEX "CreditLedger_idempotencyKey_idx" ON "CreditLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AIUsageEvent_organizationId_idx" ON "AIUsageEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AIUsageEvent_organizationId_operationType_createdAt_idx" ON "AIUsageEvent"("organizationId", "operationType", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageEvent_restaurantId_idx" ON "AIUsageEvent"("restaurantId");

-- CreateIndex
CREATE INDEX "AIUsageEvent_restaurantId_operationType_createdAt_idx" ON "AIUsageEvent"("restaurantId", "operationType", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageEvent_operationType_createdAt_idx" ON "AIUsageEvent"("operationType", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageEvent_createdAt_idx" ON "AIUsageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DailyUsageSummary_restaurantId_idx" ON "DailyUsageSummary"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyUsageSummary_restaurantId_date_key" ON "DailyUsageSummary"("restaurantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CostRateVersion_modelId_key" ON "CostRateVersion"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitPolicy_scope_key" ON "RateLimitPolicy"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "DinerSession_sessionToken_key" ON "DinerSession"("sessionToken");

-- CreateIndex
CREATE INDEX "DinerSession_restaurantId_idx" ON "DinerSession"("restaurantId");

-- CreateIndex
CREATE INDEX "DinerSession_restaurantId_tableId_idx" ON "DinerSession"("restaurantId", "tableId");

-- CreateIndex
CREATE INDEX "DinerSession_sessionToken_idx" ON "DinerSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_restaurantId_idx" ON "ChatMessage"("restaurantId");

-- CreateIndex
CREATE INDEX "ChatMessage_restaurantId_createdAt_idx" ON "ChatMessage"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_restaurantId_idx" ON "ScanEvent"("restaurantId");

-- CreateIndex
CREATE INDEX "ScanEvent_restaurantId_timestamp_idx" ON "ScanEvent"("restaurantId", "timestamp");

-- CreateIndex
CREATE INDEX "ScanEvent_restaurantId_tableId_timestamp_idx" ON "ScanEvent"("restaurantId", "tableId", "timestamp");

-- CreateIndex
CREATE INDEX "ScanEvent_timestamp_idx" ON "ScanEvent"("timestamp");

-- CreateIndex
CREATE INDEX "DishInteractionEvent_restaurantId_idx" ON "DishInteractionEvent"("restaurantId");

-- CreateIndex
CREATE INDEX "DishInteractionEvent_restaurantId_timestamp_idx" ON "DishInteractionEvent"("restaurantId", "timestamp");

-- CreateIndex
CREATE INDEX "DishInteractionEvent_restaurantId_eventType_timestamp_idx" ON "DishInteractionEvent"("restaurantId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "DishInteractionEvent_menuItemId_idx" ON "DishInteractionEvent"("menuItemId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminEmail_idx" ON "AdminAuditLog"("adminEmail");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimRequest_claimTokenHash_key" ON "ClaimRequest"("claimTokenHash");

-- CreateIndex
CREATE INDEX "ClaimRequest_restaurantId_idx" ON "ClaimRequest"("restaurantId");

-- CreateIndex
CREATE INDEX "ClaimRequest_claimTokenHash_idx" ON "ClaimRequest"("claimTokenHash");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_isResolved_idx" ON "SystemAlert"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantStaff_loginId_key" ON "RestaurantStaff"("loginId");

-- CreateIndex
CREATE INDEX "RestaurantStaff_restaurantId_idx" ON "RestaurantStaff"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantStaff_restaurantId_isActive_idx" ON "RestaurantStaff"("restaurantId", "isActive");

-- CreateIndex
CREATE INDEX "RestaurantStaff_loginId_idx" ON "RestaurantStaff"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_sessionTokenHash_key" ON "StaffSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_idx" ON "StaffSession"("staffId");

-- CreateIndex
CREATE INDEX "StaffSession_sessionTokenHash_idx" ON "StaffSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "Order_restaurantId_status_placedAt_idx" ON "Order"("restaurantId", "status", "placedAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_tableId_placedAt_idx" ON "Order"("restaurantId", "tableId", "placedAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_dinerSessionId_placedAt_idx" ON "Order"("restaurantId", "dinerSessionId", "placedAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_customerId_placedAt_idx" ON "Order"("restaurantId", "customerId", "placedAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_createdAt_idx" ON "Order"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_updatedAt_idx" ON "Order"("restaurantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_restaurantId_orderNumber_key" ON "Order"("restaurantId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_restaurantMenuItemId_idx" ON "OrderItem"("restaurantMenuItemId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_changedByStaffId_idx" ON "OrderStatusHistory"("changedByStaffId");

-- CreateIndex
CREATE INDEX "MenuModifierGroup_restaurantMenuItemId_idx" ON "MenuModifierGroup"("restaurantMenuItemId");

-- CreateIndex
CREATE INDEX "MenuModifierOption_modifierGroupId_idx" ON "MenuModifierOption"("modifierGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOrderingSettings_restaurantId_key" ON "RestaurantOrderingSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "OrderEvent_restaurantId_createdAt_idx" ON "OrderEvent"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "Customer_restaurantId_updatedAt_idx" ON "Customer"("restaurantId", "updatedAt");

-- CreateIndex
CREATE INDEX "Customer_restaurantId_creditBalanceMinor_idx" ON "Customer"("restaurantId", "creditBalanceMinor");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_restaurantId_mobile_key" ON "Customer"("restaurantId", "mobile");

-- CreateIndex
CREATE INDEX "CustomerCreditLedger_restaurantId_customerId_createdAt_idx" ON "CustomerCreditLedger"("restaurantId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerCreditLedger_orderId_idx" ON "CustomerCreditLedger"("orderId");

-- CreateIndex
CREATE INDEX "idx_service_call_rest_status" ON "TableServiceCall"("restaurantId", "status", "requestedAt" DESC);

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSettings" ADD CONSTRAINT "RestaurantSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTheme" ADD CONSTRAINT "RestaurantTheme_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "CanonicalDish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_imageOverrideAssetId_fkey" FOREIGN KEY ("imageOverrideAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishVariant" ADD CONSTRAINT "DishVariant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "RestaurantMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalDish" ADD CONSTRAINT "CanonicalDish_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalAlias" ADD CONSTRAINT "CanonicalAlias_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "CanonicalDish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalAsset" ADD CONSTRAINT "CanonicalAsset_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "CanonicalDish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalAsset" ADD CONSTRAINT "CanonicalAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetVersion" ADD CONSTRAINT "AssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuUpload" ADD CONSTRAINT "MenuUpload_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "MenuUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "RestaurantMenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "CanonicalDish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_outputAssetId_fkey" FOREIGN KEY ("outputAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageEvent" ADD CONSTRAINT "AIUsageEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageEvent" ADD CONSTRAINT "AIUsageEvent_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUsageSummary" ADD CONSTRAINT "DailyUsageSummary_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinerSession" ADD CONSTRAINT "DinerSession_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinerSession" ADD CONSTRAINT "DinerSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DinerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishInteractionEvent" ADD CONSTRAINT "DishInteractionEvent_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishInteractionEvent" ADD CONSTRAINT "DishInteractionEvent_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "RestaurantMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantStaff" ADD CONSTRAINT "RestaurantStaff_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "RestaurantStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dinerSessionId_fkey" FOREIGN KEY ("dinerSessionId") REFERENCES "DinerSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_restaurantMenuItemId_fkey" FOREIGN KEY ("restaurantMenuItemId") REFERENCES "RestaurantMenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedByStaffId_fkey" FOREIGN KEY ("changedByStaffId") REFERENCES "RestaurantStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuModifierGroup" ADD CONSTRAINT "MenuModifierGroup_restaurantMenuItemId_fkey" FOREIGN KEY ("restaurantMenuItemId") REFERENCES "RestaurantMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuModifierOption" ADD CONSTRAINT "MenuModifierOption_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "MenuModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrderingSettings" ADD CONSTRAINT "RestaurantOrderingSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
