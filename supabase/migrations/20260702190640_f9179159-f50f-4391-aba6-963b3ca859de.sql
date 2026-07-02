DELETE FROM public.patient_blocks WHERE block_template_id IN (
  SELECT id FROM public.block_templates WHERE title IN ('Vikttrend','Viktvärden','Blodsockervärden')
);
DELETE FROM public.block_templates WHERE title IN ('Vikttrend','Viktvärden','Blodsockervärden');