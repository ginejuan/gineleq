-- ============================================
-- GineLeq — Tabla Lista de Espera Quirúrgica
-- ============================================
-- 
-- Ejecutar este script en Supabase SQL Editor.
-- Contiene las 40 columnas del Excel + 3 campos manuales
-- + blind indices + timestamps.
-- 
-- Campos PII (paciente, nhc, telefonos, direccion) se
-- almacenan cifrados con AES-256-GCM desde la aplicación.
-- 

CREATE TABLE IF NOT EXISTS lista_espera (
    -- Clave primaria (Registro de Demanda Quirúrgica)
    rdq                     BIGINT PRIMARY KEY,

    -- Fechas y tiempos
    f_inscripcion           DATE,
    t_registro              INTEGER DEFAULT 0,
    t_garantia              INTEGER DEFAULT 0,
    t_total                 INTEGER DEFAULT 0,

    -- Estado de programación y garantía
    est_programacion        TEXT DEFAULT '',
    estado_garantia         TEXT DEFAULT '',
    tipo_estado_garantia    TEXT DEFAULT '',
    procedimiento_garantia  TEXT DEFAULT '',
    tiempo_garantia_proc    TEXT DEFAULT '',

    -- Datos del paciente (CIFRADOS con AES-256-GCM)
    paciente                TEXT DEFAULT '',
    nhc                     TEXT DEFAULT '',
    telefonos_contacto      TEXT DEFAULT '',
    telefonos_bdu           TEXT DEFAULT '',
    direccion               TEXT DEFAULT '',

    -- Blind indices para búsquedas sobre datos cifrados
    paciente_blind_index    TEXT DEFAULT '',
    nhc_blind_index         TEXT DEFAULT '',

    -- Datos demográficos (no cifrados)
    sexo                    TEXT DEFAULT '',
    edad                    TEXT DEFAULT '',
    fecha_nacimiento        DATE,
    localidad               TEXT DEFAULT '',
    provincia               TEXT DEFAULT '',

    -- Datos clínicos
    procedimiento           TEXT DEFAULT '',
    codigo_procedimiento    TEXT DEFAULT '',
    diagnostico             TEXT DEFAULT '',
    codigo_diagnostico      TEXT DEFAULT '',
    observaciones           TEXT DEFAULT '',
    prioridad               TEXT DEFAULT '',
    t_cirugia               TEXT DEFAULT '',
    t_anestesia             TEXT DEFAULT '',
    f_preanestesia          DATE,
    rdo_preanestesia        TEXT DEFAULT '',
    f_prev_intervencion     DATE,

    -- Datos organizativos
    unidad_funcional        TEXT DEFAULT '',
    centro                  TEXT DEFAULT '',
    facultativo             TEXT DEFAULT '',
    campo_libre_1           TEXT DEFAULT '',
    hospital_origen         TEXT DEFAULT '',
    tipo_envio              TEXT DEFAULT '',
    fecha_envio             DATE,
    ultimo_evento           TEXT DEFAULT '',
    fecha_ultimo_evento     DATE,

    -- Campos manuales (NO se sobreescriben en upsert)
    estado                  TEXT DEFAULT 'Activo',
    priorizable             BOOLEAN DEFAULT FALSE,
    comentarios             TEXT DEFAULT '',
    suspendida              BOOLEAN DEFAULT FALSE,
    fecha_suspension        DATE,

    -- Timestamps
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_lista_espera_estado ON lista_espera (estado);
CREATE INDEX IF NOT EXISTS idx_lista_espera_diagnostico ON lista_espera (diagnostico);
CREATE INDEX IF NOT EXISTS idx_lista_espera_nhc_blind ON lista_espera (nhc_blind_index);
CREATE INDEX IF NOT EXISTS idx_lista_espera_paciente_blind ON lista_espera (paciente_blind_index);
CREATE INDEX IF NOT EXISTS idx_lista_espera_t_registro ON lista_espera (t_registro);
CREATE INDEX IF NOT EXISTS idx_lista_espera_priorizable ON lista_espera (priorizable) WHERE priorizable = TRUE;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_lista_espera_updated_at ON lista_espera;
CREATE TRIGGER tr_lista_espera_updated_at
    BEFORE UPDATE ON lista_espera
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) 
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados pueden leer/escribir
CREATE POLICY "Authenticated users full access" ON lista_espera
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
