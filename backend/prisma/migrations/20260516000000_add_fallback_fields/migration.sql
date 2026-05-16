-- CreateEnum
CREATE TYPE "ConversationMode" AS ENUM ('LLM', 'MANUAL');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "mode" "ConversationMode" NOT NULL DEFAULT 'LLM';
ALTER TABLE "Conversation" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Conversation" ADD COLUMN "lastSavedAt" TIMESTAMP(3);
