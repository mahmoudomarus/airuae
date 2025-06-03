/*
  Warnings:

  - Added the required column `nights` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "nights" INTEGER NOT NULL;
