-- AlterEnum
ALTER TYPE "public"."MessageType" ADD VALUE 'CALL_LOG';

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "callData" TEXT;
