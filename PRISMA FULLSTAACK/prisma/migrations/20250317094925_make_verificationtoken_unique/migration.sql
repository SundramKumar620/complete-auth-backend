/*
  Warnings:

  - A unique constraint covering the columns `[verificationtoken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationtoken_key" ON "User"("verificationtoken");
