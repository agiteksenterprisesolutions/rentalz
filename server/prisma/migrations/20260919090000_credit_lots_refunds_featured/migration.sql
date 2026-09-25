-- Ad: optional end of the featured window (null while featured = until an admin removes it)
ALTER TABLE `Ad` ADD COLUMN `featuredUntil` DATETIME(3) NULL;
CREATE INDEX `Ad_isFeatured_featuredUntil_idx` ON `Ad`(`isFeatured`, `featuredUntil`);

-- Order: refund bookkeeping
ALTER TABLE `Order` ADD COLUMN `refundedAt` DATETIME(3) NULL,
    ADD COLUMN `stripeRefundId` VARCHAR(255) NULL;

-- OrderItem: package terms snapshotted at purchase time
ALTER TABLE `OrderItem` ADD COLUMN `durationDays` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `featuredDays` INTEGER NOT NULL DEFAULT 0;

-- Ad credit ledger
CREATE TABLE `AdCreditLot` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `source` ENUM('PURCHASE', 'FREE', 'ADMIN') NOT NULL,
    `orderItemId` VARCHAR(191) NULL,
    `granted` INTEGER NOT NULL,
    `remaining` INTEGER NOT NULL,
    `featuredDays` INTEGER NOT NULL DEFAULT 0,
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdCreditLot_userId_remaining_createdAt_idx`(`userId`, `remaining`, `createdAt`),
    INDEX `AdCreditLot_orderItemId_idx`(`orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdCreditLot` ADD CONSTRAINT `AdCreditLot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdCreditLot` ADD CONSTRAINT `AdCreditLot_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing per-user credit balances become one free lot each
INSERT INTO `AdCreditLot` (`id`, `userId`, `source`, `granted`, `remaining`, `featuredDays`, `durationDays`, `createdAt`)
SELECT UUID(), `id`, 'FREE', `adCredits`, `adCredits`, 0, 30, CURRENT_TIMESTAMP(3) FROM `User` WHERE `adCredits` > 0;

ALTER TABLE `User` DROP COLUMN `adCredits`;
