/*
  Warnings:

  - Added the required column `userId` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/

-- Nullable
ALTER TABLE "CartItem" ADD COLUMN "userId" INTEGER;

-- Update existing CartItems with userId from Cart
UPDATE "CartItem"
SET "userId" = "Cart"."userId"
FROM "Cart"
WHERE "CartItem"."cartId" = "Cart"."id";

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

