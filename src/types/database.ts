/**
 * Tipos del Modelo de Datos - GineLeq
 * 
 * Basado en arquitectura.md §3 (Modelo de Datos y Seguridad)
 * 
 * Convención: Los campos marcados como *_encrypted se almacenan cifrados
 * con AES-256-GCM. Los campos *_blind_index son HMAC-SHA256 para búsquedas exactas.
 */

// --------------------------------------------------------------------------
// Estado de la intervención
// --------------------------------------------------------------------------

export type EstadoIntervencion = 'Activo' | 'Pasivo';

// --------------------------------------------------------------------------
// Tipo de alerta clínica (ver arquitectura.md §6)
// --------------------------------------------------------------------------

export type TipoAlerta = 'oncologica_mama' | 'oncologica_ginecologia' | 'garantia' | 'estandar';

// --------------------------------------------------------------------------
// Registro de Intervención (tabla principal)
// --------------------------------------------------------------------------

export interface Intervencion {
    /** Registro de Demanda Quirúrgica - Clave primaria (arquitectura.md §3.1) */
    rdq: string;

    /** Nombre del paciente - Cifrado AES-256-GCM */
    paciente_encrypted: string;
    /** IV del cifrado del paciente */
    paciente_iv: string;

    /** Número de Historia Clínica - Cifrado AES-256-GCM */
    nhc_encrypted: string;
    /** IV del cifrado del NHC */
    nhc_iv: string;
    /** Blind Index del NHC para búsquedas exactas */
    nhc_blind_index: string;

    /** Diagnóstico (texto libre, no cifrado) */
    diagnostico: string;

    /** Intervención quirúrgica propuesta */
    intervencion_propuesta: string;

    /** Tiempo de registro (días de espera) devuelto como Integer desde Excel */
    t_registro: number;

    /** Tiempo de garantía (días de garantía consumidos) devuelto como Integer desde Excel */
    t_garantia: number;

    /** Indica si está sujeto a decreto de garantía (ej. "SI") */
    procedimiento_garantia: string;

    /** Tipo de anestesia requerida */
    t_anestesia: string | null;

    /** Resultado de la preanestesia */
    rdo_preanestesia: string | null;

    /** Plazo de garantía en días (para pacientes bajo decreto de garantía) */
    plazo_garantia: number | null;

    // --- Campos de Información Extra ---
    procedimiento?: string;
    observaciones?: string;

    // --- Campos de Gestión Manual (arquitectura.md §3.3) ---

    /** Estado del paciente en la lista */
    estado: EstadoIntervencion;

    /** Comentarios del equipo médico */
    comentarios: string | null;

    /** Marcador de priorización manual */
    priorizable: boolean;

    // --- Metadatos ---

    /** Timestamp de creación del registro */
    created_at: string;

    /** Timestamp de última actualización */
    updated_at: string;
}

// --------------------------------------------------------------------------
// Datos descifrados del paciente (solo en memoria, nunca persistido)
// --------------------------------------------------------------------------

export interface DatosPacienteDescifrados {
    paciente: string;
    nhc: string;
}

// --------------------------------------------------------------------------
// Sesión de Quirófano (arquitectura.md §7)
// --------------------------------------------------------------------------

export interface SesionQuirofano {
    id: string;
    fecha: string; // ISO 8601
    tipo_quirofano: string;
    equipo_medico: string[];
    created_at: string;
    updated_at: string;
}

// --------------------------------------------------------------------------
// Alertas calculadas (arquitectura.md §6)
// --------------------------------------------------------------------------

export interface AlertaClinica {
    rdq: string;
    tipo: TipoAlerta;
    dias_transcurridos: number;
    dias_limite: number;
    dias_restantes: number;
    es_urgente: boolean;
}

// --------------------------------------------------------------------------
// KPIs del Dashboard (arquitectura.md §10.1)
// --------------------------------------------------------------------------

export interface DashboardKPIs {
    censoTotal: number;
    censoOncologicoTotal: number;
    censoOncoMama: number;
    censoOncoGinecologia: number;
    vistoBuenoAnestesia: number;
    cirugiaLocalSinAnestesia: number;
    demoraMedia: {
        global: number;
        oncoMama: number;
        oncoGinecologia: number;
        estandar: number;
    };
}

// --------------------------------------------------------------------------
// Agenda de Quirófanos y Cirujanos
// --------------------------------------------------------------------------

export interface Cirujano {
    id_cirujano: string; // UUID
    nombre: string;
    apellido1: string;
    apellido2: string | null;
    telefono_movil: string | null;
    e_mail: string | null;
    onco_gine: boolean;
    onco_mama: boolean;
    created_at: string; // TS
    updated_at: string; // TS
}

export interface Quirofano {
    id_quirofano: string; // UUID
    fecha: string; // Date
    turno: 'Mañana' | 'Tarde' | 'Continuidad asistencial' | string;
    tipo_quirofano: string | null;
    observaciones: string | null;
    created_at: string; // TS
    updated_at: string; // TS
}

export interface QuirofanoCirujano {
    id_quirofano: string;
    id_cirujano: string;
    created_at: string;
}

// Tipo extendido para recuperar un quirófano con sus cirujanos adjuntos (JOIN)
export interface QuirofanoConCirujanos extends Quirofano {
    quirofano_cirujano?: {
        cirujanos: Cirujano;
    }[];
}

// --------------------------------------------------------------------------
// Quirofano <-> Intervencion (Ayuda Programación)
// --------------------------------------------------------------------------

export interface QuirofanoIntervencion {
    id: string; // UUID
    id_quirofano: string; // UUID
    rdq: number; // BIGINT (Representado como number en TS por conveniencia o string si es demasiado grande)
    orden: number;
    created_at: string; // TS
}
