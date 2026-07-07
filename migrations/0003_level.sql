-- Add level and experience columns to users table
ALTER TABLE "users" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "experience" INTEGER NOT NULL DEFAULT 0;
