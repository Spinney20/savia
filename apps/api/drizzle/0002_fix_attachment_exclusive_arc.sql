-- Fix exclusive arc constraint to allow orphan attachments (Option B upload flow).
-- Orphan attachments have all FK columns NULL (0 non-null), which is needed
-- when files are uploaded before being linked to an entity.

ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_exclusive_arc_check;

ALTER TABLE attachments ADD CONSTRAINT attachments_exclusive_arc_check CHECK (
  (
    (CASE WHEN inspection_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN inspection_item_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN training_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN training_material_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN issue_report_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN issue_comment_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN employee_document_id IS NOT NULL THEN 1 ELSE 0 END)
  ) <= 1
);
