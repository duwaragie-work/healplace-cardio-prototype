-- Switch to local MiniLM embeddings (384-dim) from Mistral (1024-dim).
-- Nullify existing embeddings first since they are incompatible.

UPDATE "Conversation" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;
UPDATE "DocumentVector" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;

-- Alter column types to 384 dimensions (all-MiniLM-L6-v2)
ALTER TABLE "Conversation" ALTER COLUMN "embedding" TYPE vector(384);
ALTER TABLE "DocumentVector" ALTER COLUMN "embedding" TYPE vector(384);
