-- Orders closed before paid/due tracking was introduced were closed through the
-- "Paid & Close" action. Preserve that meaning in the new payment fields.
UPDATE "Order"
SET
  "paidMinor" = "totalMinor",
  "dueMinor" = 0,
  "paymentStatus" = 'PAID'
WHERE
  "status" = 'COMPLETED'
  AND "paymentStatus" = 'PENDING'
  AND "paidMinor" = 0
  AND "dueMinor" = 0;

-- Prisma manages @updatedAt in the client, so the database column should not
-- retain the temporary default used when the customer table was added.
ALTER TABLE "Customer" ALTER COLUMN "updatedAt" DROP DEFAULT;
