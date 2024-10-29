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