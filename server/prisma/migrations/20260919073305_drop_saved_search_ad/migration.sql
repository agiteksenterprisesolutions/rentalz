/*
  Warnings:

  - You are about to drop the column `adId` on the `SavedSearch` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `SavedSearch` DROP FOREIGN KEY `SavedSearch_adId_fkey`;

-- DropIndex
DROP INDEX `SavedSearch_adId_fkey` ON `SavedSearch`;

-- AlterTable
ALTER TABLE `SavedSearch` DROP COLUMN `adId`;
