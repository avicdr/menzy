-- Menzy Performance Compound Indexes (Non-destructive & Idempotent)
-- Safe to run directly against PostgreSQL / Neon via psql or Neon SQL Editor.
-- Note: Do NOT run `prisma db push --accept-data-loss` because `TableServiceCall`
-- is managed outside Prisma schema by `src/lib/tables/service-call-service.ts`.

CREATE INDEX IF NOT EXISTS "AIUsageEvent_organizationId_operationType_createdAt_idx"
  ON "AIUsageEvent" ("organizationId", "operationType", "createdAt");

CREATE INDEX IF NOT EXISTS "AIUsageEvent_restaurantId_operationType_createdAt_idx"
  ON "AIUsageEvent" ("restaurantId", "operationType", "createdAt");

CREATE INDEX IF NOT EXISTS "AIUsageEvent_operationType_createdAt_idx"
  ON "AIUsageEvent" ("operationType", "createdAt");

CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_createdAt_idx"
  ON "ChatMessage" ("sessionId", "createdAt");

CREATE INDEX IF NOT EXISTS "ChatMessage_restaurantId_createdAt_idx"
  ON "ChatMessage" ("restaurantId", "createdAt");

CREATE INDEX IF NOT EXISTS "CreditLedger_organizationId_creditType_timestamp_idx"
  ON "CreditLedger" ("organizationId", "creditType", "timestamp");

CREATE INDEX IF NOT EXISTS "DinerSession_restaurantId_tableId_idx"
  ON "DinerSession" ("restaurantId", "tableId");

CREATE INDEX IF NOT EXISTS "DishInteractionEvent_restaurantId_timestamp_idx"
  ON "DishInteractionEvent" ("restaurantId", "timestamp");

CREATE INDEX IF NOT EXISTS "DishInteractionEvent_restaurantId_eventType_timestamp_idx"
  ON "DishInteractionEvent" ("restaurantId", "eventType", "timestamp");

CREATE INDEX IF NOT EXISTS "EntitlementGrant_organizationId_isActive_expirationDate_idx"
  ON "EntitlementGrant" ("organizationId", "isActive", "expirationDate");

CREATE INDEX IF NOT EXISTS "ExtractionJob_restaurantId_createdAt_idx"
  ON "ExtractionJob" ("restaurantId", "createdAt");

CREATE INDEX IF NOT EXISTS "ExtractionJob_status_createdAt_idx"
  ON "ExtractionJob" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "GenerationJob_restaurantId_status_createdAt_idx"
  ON "GenerationJob" ("restaurantId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "GenerationJob_status_createdAt_idx"
  ON "GenerationJob" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Menu_restaurantId_active_sortOrder_idx"
  ON "Menu" ("restaurantId", "active", "sortOrder");

CREATE INDEX IF NOT EXISTS "Order_restaurantId_dinerSessionId_placedAt_idx"
  ON "Order" ("restaurantId", "dinerSessionId", "placedAt");

CREATE INDEX IF NOT EXISTS "Order_restaurantId_updatedAt_idx"
  ON "Order" ("restaurantId", "updatedAt");

CREATE INDEX IF NOT EXISTS "RestaurantMenuItem_restaurantId_isPublished_sortOrder_idx"
  ON "RestaurantMenuItem" ("restaurantId", "isPublished", "sortOrder");

CREATE INDEX IF NOT EXISTS "RestaurantMenuItem_restaurantId_isPublished_isAvailable_sor_idx"
  ON "RestaurantMenuItem" ("restaurantId", "isPublished", "isAvailable", "sortOrder");

CREATE INDEX IF NOT EXISTS "RestaurantMenuItem_categoryId_isPublished_sortOrder_idx"
  ON "RestaurantMenuItem" ("categoryId", "isPublished", "sortOrder");

CREATE INDEX IF NOT EXISTS "RestaurantStaff_restaurantId_isActive_idx"
  ON "RestaurantStaff" ("restaurantId", "isActive");

CREATE INDEX IF NOT EXISTS "RestaurantTable_restaurantId_isArchived_isActive_idx"
  ON "RestaurantTable" ("restaurantId", "isArchived", "isActive");

CREATE INDEX IF NOT EXISTS "ScanEvent_restaurantId_timestamp_idx"
  ON "ScanEvent" ("restaurantId", "timestamp");

CREATE INDEX IF NOT EXISTS "ScanEvent_restaurantId_tableId_timestamp_idx"
  ON "ScanEvent" ("restaurantId", "tableId", "timestamp");

