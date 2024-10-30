-- Disable foreign key checks temporarily
ALTER TABLE tags DROP CONSTRAINT tags_note_id_fkey;
ALTER TABLE folders DROP CONSTRAINT folders_parent_id_fkey;

-- Truncate tables to remove all data
TRUNCATE TABLE tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE notes RESTART IDENTITY CASCADE;
TRUNCATE TABLE folders RESTART IDENTITY CASCADE;

-- Restore foreign key constraints
ALTER TABLE tags ADD CONSTRAINT tags_note_id_fkey FOREIGN KEY (note_id) REFERENCES notes(id);
ALTER TABLE folders ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders(id);

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notes ADD COLUMN metadata JSONB;
    END IF;
END $$;