-- DropIndex
DROP INDEX "hnsw_index";

-- AlterTable
ALTER TABLE "DocumentVector" ADD COLUMN     "sourceActiveStatus" BOOLEAN NOT NULL DEFAULT true;
