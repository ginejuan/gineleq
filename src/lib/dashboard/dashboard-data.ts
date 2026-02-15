/**
 * Dashboard Data Layer
 *
 * Server-only module. Queries `lista_espera` and computes
 * all KPIs, aggregations, and chart data.
 *
 * Principio SoC: esta capa NO sabe de UI.
 * Principio Agnosticismo: usa el wrapper de Supabase.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface DashboardKpis {
    censoTotal: number;
    priorizables: number;
    suspendidas: number;
    oncoMama: number;
    oncoGine: number;
    vistoBuenoAnestesia: number;
    requierenAnestesia: number;
    pctAnestesiaApto: number;
    cirugiaLocalSin: number;
}

export interface DemoraMedia {
    global: number;
    mama: number;
    gine: number;
    estandar: number;
}

export interface ComposicionSegment {
    name: string;
    value: number;
    color: string;
}

export interface TramoEspera {
    rango: string;
    cantidad: number;
}

export interface PatientRow {
    rdq: number;
    paciente: string;
    nhc: string;
    diagnostico: string;
    procedimiento: string;
    t_registro: number;
    t_anestesia: string;
    rdo_preanestesia: string;
    priorizable: boolean;
    suspendida: boolean;
    prioridad: string;
    facultativo: string;
    estado_garantia: string;
    f_inscripcion: string | null;
}

export interface DashboardData {
    kpis: DashboardKpis;
    demora: DemoraMedia;
    composicion: ComposicionSegment[];
    readiness: { ready: number; total: number };
    tramosEspera: TramoEspera[];
    oncoGauge: { enPlazo: number; total: number };
    patients: PatientRow[];
}

// --------------------------------------------------------------------------
// Helpers de clasificación
// --------------------------------------------------------------------------

function isOncoMama(diagnostico: string): boolean {
    const d = diagnostico.toUpperCase();
    return d.startsWith('NEOPLASIA MALIGNA') && d.includes('MAMA');
}

function isOncoGine(diagnostico: string): boolean {
    const d = diagnostico.toUpperCase();
    return d.startsWith('NEOPLASIA MALIGNA') && !d.includes('MAMA');
}

function isOnco(diagnostico: string): boolean {
    return diagnostico.toUpperCase().startsWith('NEOPLASIA MALIGNA');
}

function isLocalOrSinAnestesia(tAnestesia: string): boolean {
    const t = tAnestesia.toUpperCase();
    return t.includes('LOCAL') || t.includes('SIN ANESTESIA');
}

function isApto(rdoPreanestesia: string): boolean {
    return rdoPreanestesia.toUpperCase().trim() === 'APTO';
}

// --------------------------------------------------------------------------
// Main query
// --------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
    const supabase = createSupabaseAdminClient();

    // Traer solo pacientes activos, campos necesarios
    const { data: rows, error } = await supabase
        .from('lista_espera')
        .select(
            'rdq, paciente, nhc, diagnostico, procedimiento, t_registro, ' +
            't_anestesia, rdo_preanestesia, priorizable, suspendida, ' +
            'prioridad, facultativo, estado_garantia, f_inscripcion'
        )
        .eq('estado', 'Activo')
        .order('t_registro', { ascending: false });

    if (error) {
        throw new Error(`Error cargando datos del dashboard: ${error.message}`);
    }

    const patients = (rows ?? []) as unknown as Record<string, unknown>[];

    // Descifrar PII server-side
    const decryptedPatients: PatientRow[] = patients.map(p => ({
        rdq: Number(p.rdq),
        paciente: safeDecrypt(String(p.paciente ?? '')),
        nhc: safeDecrypt(String(p.nhc ?? '')),
        diagnostico: String(p.diagnostico ?? ''),
        procedimiento: String(p.procedimiento ?? ''),
        t_registro: Number(p.t_registro ?? 0),
        t_anestesia: String(p.t_anestesia ?? ''),
        rdo_preanestesia: String(p.rdo_preanestesia ?? ''),
        priorizable: Boolean(p.priorizable),
        suspendida: Boolean(p.suspendida),
        prioridad: String(p.prioridad ?? ''),
        facultativo: String(p.facultativo ?? ''),
        estado_garantia: String(p.estado_garantia ?? ''),
        f_inscripcion: p.f_inscripcion ? String(p.f_inscripcion) : null,
    }));

    // --- KPIs ---
    const censoTotal = decryptedPatients.length;
    const priorizables = decryptedPatients.filter(p => p.priorizable).length;
    const suspendidas = decryptedPatients.filter(p => p.suspendida).length;
    const oncoMama = decryptedPatients.filter(p => isOncoMama(p.diagnostico)).length;
    const oncoGine = decryptedPatients.filter(p => isOncoGine(p.diagnostico)).length;

    const requireAnesthesia = decryptedPatients.filter(
        p => !isLocalOrSinAnestesia(p.t_anestesia)
    );
    const vistoBuenoAnestesia = requireAnesthesia.filter(
        p => isApto(p.rdo_preanestesia)
    ).length;
    const pctAnestesiaApto = requireAnesthesia.length > 0
        ? Math.round((vistoBuenoAnestesia / requireAnesthesia.length) * 100)
        : 0;

    const cirugiaLocalSin = decryptedPatients.filter(
        p => isLocalOrSinAnestesia(p.t_anestesia)
    ).length;

    // --- Demora Media ---
    const registros = decryptedPatients.map(p => p.t_registro);
    const mamaRegistros = decryptedPatients.filter(p => isOncoMama(p.diagnostico)).map(p => p.t_registro);
    const gineRegistros = decryptedPatients.filter(p => isOncoGine(p.diagnostico)).map(p => p.t_registro);
    const estandarRegistros = decryptedPatients.filter(p => !isOnco(p.diagnostico)).map(p => p.t_registro);

    const avg = (arr: number[]) => arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;

    // --- Composición (Donut) ---
    const oncoMamaCount = oncoMama;
    const oncoGineCount = oncoGine;
    const garantiaCount = decryptedPatients.filter(
        p => !isOnco(p.diagnostico) && p.estado_garantia.trim() !== ''
    ).length;
    const estandarCount = censoTotal - oncoMamaCount - oncoGineCount - garantiaCount;

    const composicion: ComposicionSegment[] = [
        { name: 'Onco-Mama', value: oncoMamaCount, color: '#EC4899' },
        { name: 'Onco-Gine', value: oncoGineCount, color: '#8B5CF6' },
        { name: 'Garantía', value: garantiaCount, color: '#F59E0B' },
        { name: 'Estándar', value: estandarCount, color: '#6B7280' },
    ];

    // --- Readiness (Progress) ---
    const aptoCount = decryptedPatients.filter(p => isApto(p.rdo_preanestesia)).length;
    const ready = aptoCount + cirugiaLocalSin;

    // --- Tramos de Espera (Bar) ---
    const tramos = [
        { rango: '0-30', min: 0, max: 30 },
        { rango: '31-90', min: 31, max: 90 },
        { rango: '91-180', min: 91, max: 180 },
        { rango: '>180', min: 181, max: Infinity },
    ];
    const tramosEspera: TramoEspera[] = tramos.map(t => ({
        rango: t.rango,
        cantidad: decryptedPatients.filter(
            p => p.t_registro >= t.min && p.t_registro <= t.max
        ).length,
    }));

    // --- Onco Gauge ---
    const oncoAll = decryptedPatients.filter(p => isOnco(p.diagnostico));
    const oncoEnPlazo = oncoAll.filter(p => p.t_registro <= 30).length;

    return {
        kpis: {
            censoTotal,
            priorizables,
            suspendidas,
            oncoMama,
            oncoGine,
            vistoBuenoAnestesia,
            requierenAnestesia: requireAnesthesia.length,
            pctAnestesiaApto,
            cirugiaLocalSin,
        },
        demora: {
            global: avg(registros),
            mama: avg(mamaRegistros),
            gine: avg(gineRegistros),
            estandar: avg(estandarRegistros),
        },
        composicion,
        readiness: { ready, total: censoTotal },
        tramosEspera,
        oncoGauge: { enPlazo: oncoEnPlazo, total: oncoAll.length },
        patients: decryptedPatients,
    };
}

// --------------------------------------------------------------------------
// Utils
// --------------------------------------------------------------------------

function safeDecrypt(ciphertext: string): string {
    if (!ciphertext || ciphertext.trim() === '') return '';
    try {
        return decrypt(ciphertext);
    } catch {
        // If decryption fails (e.g. not encrypted), return as-is
        return ciphertext;
    }
}
