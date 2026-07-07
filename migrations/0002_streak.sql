-- Add streak tracking columns to users table
ALTER TABLE "users" ADD COLUMN "streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lastPracticeAt" DATETIME;
