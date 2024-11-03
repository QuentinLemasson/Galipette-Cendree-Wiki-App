-- =========================================
-- Script: flush_db.sql
-- Description: Truncates all data and resets sequences based on db.schema.md
-- =========================================

BEGIN;

-- 1. Disable foreign key constraints by dropping them

ALTER TABLE article_relations 
    DROP CONSTRAINT IF EXISTS article_relations_article_path_fkey;
ALTER TABLE article_relations 
    DROP CONSTRAINT IF EXISTS article_relations_related_article_path_fkey;

ALTER TABLE article_tags 
    DROP CONSTRAINT IF EXISTS article_tags_article_path_fkey;
ALTER TABLE article_tags 
    DROP CONSTRAINT IF EXISTS article_tags_tag_id_fkey;

ALTER TABLE articles 
    DROP CONSTRAINT IF EXISTS articles_folder_id_fkey;

ALTER TABLE folders 
    DROP CONSTRAINT IF EXISTS folders_parent_id_fkey;

-- 2. Truncate tables to remove all data and reset sequences

TRUNCATE TABLE article_relations RESTART IDENTITY CASCADE;
TRUNCATE TABLE article_tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE articles RESTART IDENTITY CASCADE;
TRUNCATE TABLE folders RESTART IDENTITY CASCADE;

-- 3. Restore foreign key constraints with correct references

ALTER TABLE article_relations 
    ADD CONSTRAINT article_relations_article_path_fkey 
    FOREIGN KEY (article_path) REFERENCES articles(path) ON DELETE CASCADE;

ALTER TABLE article_relations 
    ADD CONSTRAINT article_relations_related_article_path_fkey 
    FOREIGN KEY (related_article_path) REFERENCES articles(path) ON DELETE CASCADE;

ALTER TABLE article_tags 
    ADD CONSTRAINT article_tags_article_path_fkey 
    FOREIGN KEY (article_path) REFERENCES articles(path) ON DELETE CASCADE;

ALTER TABLE article_tags 
    ADD CONSTRAINT article_tags_tag_id_fkey 
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE articles 
    ADD CONSTRAINT articles_folder_id_fkey 
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

ALTER TABLE folders 
    ADD CONSTRAINT folders_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL;

-- 4. Ensure metadata column exists with proper default

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE articles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

COMMIT;

-- =========================================
-- End of flush_db.sql
-- =========================================