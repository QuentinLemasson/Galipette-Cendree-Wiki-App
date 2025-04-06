-- CreateTable
CREATE TABLE "import_metadata" (
    "id" SERIAL NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "last_import" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "import_count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "import_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "git_import_logs" (
    "id" SERIAL NOT NULL,
    "commit_hash" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "files_changed" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "git_import_logs_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "import_metadata"
ADD COLUMN "commit_hash" TEXT,
ADD COLUMN "git_status" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "import_metadata_file_path_key" ON "import_metadata"("file_path");
CREATE INDEX "import_metadata_file_path_file_hash_idx" ON "import_metadata"("file_path", "file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "git_import_logs_commit_hash_key" ON "git_import_logs"("commit_hash");

-- CreateIndex
CREATE INDEX "git_import_logs_commit_hash_idx" ON "git_import_logs"("commit_hash");

-- CreateIndex
CREATE INDEX "import_metadata_commit_hash_idx" ON "import_metadata"("commit_hash"); 