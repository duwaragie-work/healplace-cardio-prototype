-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceFormat" TEXT NOT NULL,
    "sourceSize" INTEGER NOT NULL,
    "sourceChunkCount" INTEGER NOT NULL,
    "sourceResourceLink" TEXT NOT NULL,
    "sourceTags" TEXT[],
    "sourceActiveStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVector" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),
    "documentId" TEXT NOT NULL,

    CONSTRAINT "DocumentVector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hnsw_index" ON "DocumentVector"("embedding");

-- AddForeignKey
ALTER TABLE "DocumentVector" ADD CONSTRAINT "DocumentVector_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
