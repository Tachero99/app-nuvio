-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "description" TEXT,
ADD COLUMN     "facebook" VARCHAR(255),
ADD COLUMN     "hours" JSONB,
ADD COLUMN     "instagram" VARCHAR(255),
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "menuConfig" JSONB,
ADD COLUMN     "website" VARCHAR(255);
