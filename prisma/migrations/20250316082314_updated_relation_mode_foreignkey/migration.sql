-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_article_path_fkey" FOREIGN KEY ("article_path") REFERENCES "articles"("path") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_related_article_path_fkey" FOREIGN KEY ("related_article_path") REFERENCES "articles"("path") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_path_fkey" FOREIGN KEY ("article_path") REFERENCES "articles"("path") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
