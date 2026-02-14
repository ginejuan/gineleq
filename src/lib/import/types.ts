/**
 * Tipos para el módulo de Importación Excel
 * 
 * Separación de responsabilidades: los tipos son compartidos
 * entre el parser, las acciones del servidor y la UI.
 */

// --------------------------------------------------------------------------
// Fila de la tabla lista_espera (campos de BD)
// --------------------------------------------------------------------------

/** Campos que provienen directamente del Excel */
export interface ExcelRow {
    rdq: number;
    f_inscripcion: string | null;
    est_programacion: string;
    estado_garantia: string;
    tipo_estado_garantia: string;
    procedimiento_garantia: string;
    tiempo_garantia_proc: string;
    t_registro: number;
    t_garantia: number;
    t_total: number;
    paciente: string;
    sexo: string;
    edad: string;
    fecha_nacimiento: string | null;
    nhc: string;
    telefonos_contacto: string;
    telefonos_bdu: string;
    direccion: string;
    localidad: string;
    provincia: string;
    procedimiento: string;
    codigo_procedimiento: string;
    diagnostico: string;
    codigo_diagnostico: string;
    observaciones: string;
    prioridad: string;
    t_cirugia: string;
    t_anestesia: string;
    f_preanestesia: string | null;
    rdo_preanestesia: string;
    f_prev_intervencion: string | null;
    unidad_funcional: string;
    centro: string;
    facultativo: string;
    campo_libre_1: string;
    hospital_origen: string;
    tipo_envio: string;
    fecha_envio: string | null;
    ultimo_evento: string;
    fecha_ultimo_evento: string | null;
}

/** Fila con campos PII cifrados, lista para insertar en BD */
export interface EncryptedRow extends Omit<ExcelRow,
    'paciente' | 'nhc' | 'telefonos_contacto' | 'telefonos_bdu' | 'direccion'
> {
    paciente: string;          // Cifrado
    nhc: string;               // Cifrado
    telefonos_contacto: string; // Cifrado
    telefonos_bdu: string;     // Cifrado
    direccion: string;         // Cifrado
    paciente_blind_index: string;
    nhc_blind_index: string;
    estado: string;
    priorizable: boolean;
    comentarios: string;
}

// --------------------------------------------------------------------------
// Resultado de la importación
// --------------------------------------------------------------------------

export interface ImportResult {
    success: boolean;
    totalRows: number;
    inserted: number;
    updated: number;
    passivated: number;
    errors: string[];
    duration: number; // ms
}

// --------------------------------------------------------------------------
// Mapeo de columnas Excel → campos BD
// --------------------------------------------------------------------------

/** Mapeo de nombre de columna Excel a nombre de campo en BD */
export const EXCEL_COLUMN_MAP: Record<string, keyof ExcelRow> = {
    'RDQ': 'rdq',
    'F. Inscripción': 'f_inscripcion',
    'Est. Programación': 'est_programacion',
    'Estado Garantía': 'estado_garantia',
    'Tipo Estado Garantía': 'tipo_estado_garantia',
    'Procedimiento garantía': 'procedimiento_garantia',
    'Tiempo garantía procedimiento': 'tiempo_garantia_proc',
    'T. Registro': 't_registro',
    'T. Garantía': 't_garantia',
    'T.Total': 't_total',
    'Usuario': 'paciente',
    'Usuario (Sexo)': 'sexo',
    'Usuario (Edad)': 'edad',
    'Usuario (Fecha nacimiento)': 'fecha_nacimiento',
    'Usuario (nhc)': 'nhc',
    'Usuario (telefonos contacto)': 'telefonos_contacto',
    'Usuario (telefonos bdu)': 'telefonos_bdu',
    'Usuario (dirección)': 'direccion',
    'Usuario (localidad)': 'localidad',
    'Usuario (provincia)': 'provincia',
    'Procedimiento': 'procedimiento',
    'Código procedimiento': 'codigo_procedimiento',
    'Diagnóstico': 'diagnostico',
    'Código diagnóstico': 'codigo_diagnostico',
    'Observaciones': 'observaciones',
    'Prioridad': 'prioridad',
    'T. Cirugía': 't_cirugia',
    'T. Anestesia': 't_anestesia',
    'F. Preanestesia': 'f_preanestesia',
    'Rdo. Preanestesia': 'rdo_preanestesia',
    'F.Prev. Intervención': 'f_prev_intervencion',
    'Unidad Funcional': 'unidad_funcional',
    'Centro': 'centro',
    'Facultativo': 'facultativo',
    'Campo Libre 1': 'campo_libre_1',
    'Hospital origen': 'hospital_origen',
    'Tipo envío': 'tipo_envio',
    'Fecha envío': 'fecha_envio',
    'Último evento': 'ultimo_evento',
    'Fecha último evento': 'fecha_ultimo_evento',
};

/** Campos que contienen fechas en formato serial Excel */
export const DATE_FIELDS: (keyof ExcelRow)[] = [
    'f_inscripcion',
    'fecha_nacimiento',
    'f_preanestesia',
    'f_prev_intervencion',
    'fecha_envio',
    'fecha_ultimo_evento',
];

/** Campos que contienen datos PII y deben cifrarse */
export const PII_FIELDS = [
    'paciente',
    'nhc',
    'telefonos_contacto',
    'telefonos_bdu',
    'direccion',
] as const;

/** Campos con blind index para búsquedas */
export const BLIND_INDEX_FIELDS = [
    'paciente',
    'nhc',
] as const;
