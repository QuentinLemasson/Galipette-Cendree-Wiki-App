/*
  Warnings:

  - You are about to drop the column `article_path` on the `article_relations` table. All the data in the column will be lost.
  - You are about to drop the column `related_article_path` on the `article_relations` table. All the data in the column will be lost.
  - The primary key for the `article_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `article_path` on the `article_tags` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `file_path` on the `import_metadata` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[article_from_id,article_to_id]` on the table `article_relations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[article_id]` on the table `import_metadata` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `article_from_id` to the `article_relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `article_to_id` to the `article_relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `article_id` to the `article_tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `article_id` to the `import_metadata` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "article_relations" DROP CONSTRAINT "article_relations_article_path_fkey";

-- DropForeignKey
ALTER TABLE "article_relations" DROP CONSTRAINT "article_relations_related_article_path_fkey";

-- DropForeignKey
ALTER TABLE "article_tags" DROP CONSTRAINT "article_tags_article_path_fkey";

-- DropForeignKey
ALTER TABLE "import_metadata" DROP CONSTRAINT "import_metadata_file_path_fkey";

-- DropIndex
DROP INDEX "article_relations_article_path_idx";

-- DropIndex
DROP INDEX "article_relations_article_path_related_article_path_key";

-- DropIndex
DROP INDEX "article_relations_related_article_path_idx";

-- DropIndex
DROP INDEX "import_metadata_file_path_key";

-- AlterTable
ALTER TABLE "article_relations" DROP COLUMN "article_path",
DROP COLUMN "related_article_path",
ADD COLUMN     "article_from_id" INTEGER NOT NULL,
ADD COLUMN     "article_to_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "article_tags" DROP CONSTRAINT "article_tags_pkey",
DROP COLUMN "article_path",
ADD COLUMN     "article_id" INTEGER NOT NULL,
ADD CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id", "tag_id");

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "content",
ADD COLUMN     "preview" VARCHAR(500);

-- AlterTable
ALTER TABLE "import_metadata" DROP COLUMN "file_path",
ADD COLUMN     "article_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "article_contents" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "article_id" INTEGER NOT NULL,

    CONSTRAINT "article_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_contents_article_id_key" ON "article_contents"("article_id");

-- CreateIndex
CREATE INDEX "article_relations_article_from_id_idx" ON "article_relations"("article_from_id");

-- CreateIndex
CREATE INDEX "article_relations_article_to_id_idx" ON "article_relations"("article_to_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_relations_article_from_id_article_to_id_key" ON "article_relations"("article_from_id", "article_to_id");

-- CreateIndex
CREATE INDEX "article_tags_article_id_idx" ON "article_tags"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_metadata_article_id_key" ON "import_metadata"("article_id");

-- CreateIndex
CREATE INDEX "import_metadata_article_id_idx" ON "import_metadata"("article_id");

-- AddForeignKey
ALTER TABLE "article_contents" ADD CONSTRAINT "article_contents_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_article_from_id_fkey" FOREIGN KEY ("article_from_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_article_to_id_fkey" FOREIGN KEY ("article_to_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_metadata" ADD CONSTRAINT "import_metadata_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
