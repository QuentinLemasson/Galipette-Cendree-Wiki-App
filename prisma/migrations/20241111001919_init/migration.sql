-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "folder_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_relations" (
    "id" SERIAL NOT NULL,
    "article_path" TEXT NOT NULL,
    "related_article_path" TEXT NOT NULL,

    CONSTRAINT "article_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "article_path" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_path","tag_id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_path_key" ON "articles"("path");

-- CreateIndex
CREATE INDEX "articles_path_title_idx" ON "articles"("path", "title");

-- CreateIndex
CREATE INDEX "articles_folder_id_idx" ON "articles"("folder_id");

-- CreateIndex
CREATE INDEX "article_relations_article_path_idx" ON "article_relations"("article_path");

-- CreateIndex
CREATE INDEX "article_relations_related_article_path_idx" ON "article_relations"("related_article_path");

-- CreateIndex
CREATE UNIQUE INDEX "article_relations_article_path_related_article_path_key" ON "article_relations"("article_path", "related_article_path");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "article_tags_tag_id_idx" ON "article_tags"("tag_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");
