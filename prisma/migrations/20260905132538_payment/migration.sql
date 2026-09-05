/*
  Warnings:

  - You are about to drop the column `bkashPaymentId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments_bkashPaymentId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "bkashPaymentId";
