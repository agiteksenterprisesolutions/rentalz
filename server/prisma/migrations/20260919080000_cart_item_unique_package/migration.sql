-- CartItem: a package can appear once per cart; the unused adId column is dropped.
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_adId_fkey`;
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_cartId_fkey`;
DROP INDEX `CartItem_adId_fkey` ON `CartItem`;
DROP INDEX `CartItem_cartId_packageId_adId_key` ON `CartItem`;
ALTER TABLE `CartItem` DROP COLUMN `adId`;
CREATE UNIQUE INDEX `CartItem_cartId_packageId_key` ON `CartItem`(`cartId`, `packageId`);
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
