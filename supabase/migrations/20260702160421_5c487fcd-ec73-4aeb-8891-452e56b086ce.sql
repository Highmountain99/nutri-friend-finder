
-- Deduplicate block_templates on (dietitian_id, system_key), keep oldest
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY dietitian_id, (data_config->>'system_key')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.block_templates
  WHERE data_config ? 'system_key'
)
DELETE FROM public.block_templates bt
USING ranked r
WHERE bt.id = r.id AND r.rn > 1;

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS block_templates_dietitian_system_key_uniq
ON public.block_templates (dietitian_id, ((data_config->>'system_key')))
WHERE data_config ? 'system_key';
