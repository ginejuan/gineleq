-- ============================================
-- MIGRACIÓN FASE 2: Historial de Partes (PDF)
-- ============================================

-- 1. Crear la tabla de versiones de PDF
CREATE TABLE IF NOT EXISTS public.quirofanos_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_quirofano UUID NOT NULL REFERENCES public.quirofanos(id_quirofano) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Opcional: registrar el email o nombre de usuario que lo envió
    enviado_por TEXT
);

-- Habilitar RLS
ALTER TABLE public.quirofanos_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on quirofanos_documentos" 
    ON public.quirofanos_documentos
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Crear el Bucket de Storage para los PDFs (Si no existe)
-- Nota: En Supabase a veces se requiere crear los buckets desde la UI de Storage.
-- Sin embargo, el comando SQL abajo lo intenta generar programáticamente.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partes_quirofano', 'partes_quirofano', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para partes_quirofano (Lectura y Escritura autenticada)
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'partes_quirofano');

CREATE POLICY "Auth Insert" 
    ON storage.objects FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'partes_quirofano');

CREATE POLICY "Auth Delete"
    ON storage.objects FOR DELETE 
    USING (auth.role() = 'authenticated' AND bucket_id = 'partes_quirofano');
