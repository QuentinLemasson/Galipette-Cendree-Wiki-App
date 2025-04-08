/*
  Warnings:

  - You are about to drop the column `files_changed` on the `git_import_logs` table. All the data in the column will be lost.
  - The `status` column on the `git_import_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `error` on the `import_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `file_hash` on the `import_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `git_status` on the `import_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `last_import` on the `import_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `import_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `import_metadata` table. All the data in the column will be lost.
  - Made the column `commit_hash` on table `import_metadata` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'PARTIAL');

-- DropIndex
DROP INDEX "import_metadata_file_path_file_hash_idx";

-- AlterTable
ALTER TABLE "git_import_logs" DROP COLUMN "files_changed",
ADD COLUMN     "files_added" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "files_deleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "files_modified" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "folders_added" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "folders_deleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags_added" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags_deleted" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "ImportStatus" NOT NULL DEFAULT 'SUCCESS';

-- AlterTable
ALTER TABLE "import_metadata" DROP COLUMN "error",
DROP COLUMN "file_hash",
DROP COLUMN "git_status",
DROP COLUMN "last_import",
DROP COLUMN "metadata",
DROP COLUMN "status",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "commit_hash" SET NOT NULL;

-- CreateIndex
CREATE INDEX "git_import_logs_commit_hash_status_idx" ON "git_import_logs"("commit_hash", "status");

-- AddForeignKey
ALTER TABLE "import_metadata" ADD CONSTRAINT "import_metadata_file_path_fkey" FOREIGN KEY ("file_path") REFERENCES "articles"("path") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_metadata" ADD CONSTRAINT "import_metadata_commit_hash_fkey" FOREIGN KEY ("commit_hash") REFERENCES "git_import_logs"("commit_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
