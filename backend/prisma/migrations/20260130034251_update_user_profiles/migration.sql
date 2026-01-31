-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `building_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `room_number` VARCHAR(50) NULL;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
