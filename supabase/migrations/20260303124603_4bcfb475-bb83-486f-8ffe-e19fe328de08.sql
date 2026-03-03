
-- dietitian_journal_entries
CREATE TABLE public.dietitian_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  anamnesis text,
  assessment text,
  action text,
  next_steps text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dietitian_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage journal entries for assigned patients"
  ON public.dietitian_journal_entries FOR ALL
  TO authenticated
  USING (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid())
  WITH CHECK (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid());

CREATE POLICY "Patients can view own journal entries"
  ON public.dietitian_journal_entries FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.dietitian_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- dietitian_notes (quick scratchpad)
CREATE TABLE public.dietitian_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dietitian_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage notes for assigned patients"
  ON public.dietitian_notes FOR ALL
  TO authenticated
  USING (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid())
  WITH CHECK (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid());

CREATE TRIGGER update_dietitian_notes_updated_at
  BEFORE UPDATE ON public.dietitian_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- patient_documents
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage documents for assigned patients"
  ON public.patient_documents FOR ALL
  TO authenticated
  USING (is_assigned_dietist(patient_id))
  WITH CHECK (is_assigned_dietist(patient_id) AND uploaded_by = auth.uid());

CREATE POLICY "Patients can view own documents"
  ON public.patient_documents FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

CREATE POLICY "Dietitians can upload patient documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "Dietitians can view patient documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-documents');

CREATE POLICY "Dietitians can delete patient documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'patient-documents');
