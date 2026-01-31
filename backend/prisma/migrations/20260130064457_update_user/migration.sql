/*
  Warnings:

  - You are about to drop the column `telp` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `telp`,
    ADD COLUMN `phone_number` VARCHAR(255) NULL;
