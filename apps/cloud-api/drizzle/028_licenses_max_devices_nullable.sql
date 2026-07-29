-- Allow NULL max_devices = unlimited POS seats (Business plan).
-- Existing rows keep their integer limits (Starter=1, Pro=3, etc.).
-- Default remains 1 for inserts that omit the column (non-unlimited plans).

ALTER TABLE licenses ALTER COLUMN max_devices DROP NOT NULL;
