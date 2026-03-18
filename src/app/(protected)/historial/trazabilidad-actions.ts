'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { safeDecrypt } from '@/lib/encryption';

export interface PacienteCandidato {
    rdq: string;
    paciente: string;          // Descifrado
    nhc: string;               // Descifrado (vacío si no hay)
    nhcBlindIndex: string;     // Para agrupar por paciente
    pacienteBlindIndex: string; // Fallback cuando no hay NHC
    diagnostico: string;
    intervencion_propuesta: string; // Maps to 'procedimiento' in DB
    estado: string;
    t_registro: number;
    created_at: string;
    /** true = NHC disponible, false = agrupamos por nombre */
    tieneNhc: boolean;
}

export interface QuirofanoViaje {
    id_quirofano: string;
    fecha: string;
    tipo_quirofano: string;
    completado: boolean;
    equipo_medico: string;
}

export interface ViajeEntry {
    candidato: PacienteCandidato;
    quirofanos: QuirofanoViaje[];
}

function normalizeStr(s: string): string {
    // Safe version without Unicode property escapes (works on all Node versions)
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // strip combining diacritics
}

function decodeRow(row: any): PacienteCandidato {
    const paciente = safeDecrypt(row.paciente ?? '');
    const nhcDecifrado = safeDecrypt(row.nhc ?? '');
    // A patient has an NHC if the blind index column exists and is not an empty string
    const tieneNhc = typeof row.nhc_blind_index === 'string' && row.nhc_blind_index.length > 0;

    return {
        rdq: String(row.rdq),
        paciente,
        nhc: nhcDecifrado,
        nhcBlindIndex: row.nhc_blind_index ?? '',
        pacienteBlindIndex: row.paciente_blind_index ?? '',
        diagnostico: row.diagnostico ?? '',
        intervencion_propuesta: row.procedimiento ?? row.intervencion_propuesta ?? '',
        estado: row.estado ?? '',
        t_registro: Number(row.t_registro ?? 0),
        created_at: row.created_at ?? '',
        tieneNhc,
    };
}

/**
 * PASO 1 — Busca candidatas.
 * Devuelve { ok: true, data } o { ok: false, error }.
 * Si query es numérico → busca por RDQ exacto.
 * Si es texto → descifra todos y filtra por nombre (parcial, case-insensitive).
 */
export async function buscarCandidatasAction(
    query: string
): Promise<{ ok: true; data: PacienteCandidato[] } | { ok: false; error: string }> {
    try {
        const supabase = createSupabaseAdminClient();
        query = query.trim();

        const isNumeric = /^\d+$/.test(query);

        if (isNumeric) {
            const { data, error } = await supabase
                .from('lista_espera')
                .select('*')
                .eq('rdq', query)
                .limit(1);

            if (error) {
                console.error('[trazabilidad] RDQ lookup error:', error);
                return { ok: false, error: `Error DB (RDQ): ${error.message}` };
            }
            return { ok: true, data: (data ?? []).map(decodeRow) };
        }

        // Búsqueda por nombre: descifrar todos y filtrar
        const { data, error } = await supabase
            .from('lista_espera')
            .select('rdq, paciente, nhc, nhc_blind_index, paciente_blind_index, diagnostico, procedimiento, estado, t_registro, created_at');

        if (error) {
            console.error('[trazabilidad] Name lookup error:', error);
            return { ok: false, error: `Error DB (nombre): ${error.message}` };
        }

        const needle = normalizeStr(query);

        const matches = (data ?? [])
            .map(row => {
                try { return decodeRow(row); } catch (e) { return null; }
            })
            .filter((c): c is PacienteCandidato => {
                if (!c) return false;
                return normalizeStr(c.paciente).includes(needle);
            });

        matches.sort((a, b) => {
            const an = normalizeStr(a.paciente);
            const bn = normalizeStr(b.paciente);
            const q = normalizeStr(query);
            if (an.startsWith(q) && !bn.startsWith(q)) return -1;
            if (!an.startsWith(q) && bn.startsWith(q)) return 1;
            return an.localeCompare(bn);
        });

        return { ok: true, data: matches.slice(0, 30) };
    } catch (err: any) {
        console.error('[trazabilidad] Unexpected error in buscarCandidatasAction:', err);
        return { ok: false, error: err?.message ?? 'Error inesperado en el servidor' };
    }
}

/**
 * PASO 2 — Dado un candidato seleccionado, devuelve todos los episodios del mismo paciente.
 * Estrategia de agrupación:
 * - Si tiene NHC → busca todos los RDQs con mismo nhcBlindIndex.
 * - Si no tiene NHC → busca todos los RDQs con mismo pacienteBlindIndex.
 */
export async function getViajeAction(candidato: PacienteCandidato): Promise<ViajeEntry[]> {
    const supabase = createSupabaseAdminClient();

    // Obtener todos los RDQs del mismo "paciente lógico"
    let rdqQuery = supabase.from('lista_espera').select('*');

    if (candidato.tieneNhc && candidato.nhcBlindIndex) {
        rdqQuery = rdqQuery.eq('nhc_blind_index', candidato.nhcBlindIndex);
    } else {
        rdqQuery = rdqQuery.eq('paciente_blind_index', candidato.pacienteBlindIndex);
    }

    const { data: intervenciones, error: iError } = await rdqQuery.order('created_at', { ascending: true });
    if (iError) throw new Error(iError.message);

    const viajes: ViajeEntry[] = [];

    for (const row of intervenciones ?? []) {
        const parsedCandidato = decodeRow(row);

        // Obtener asignaciones a quirófano para este RDQ
        const { data: asignaciones, error: aError } = await supabase
            .from('quirofano_intervencion')
            .select(`
                quirofanos (
                    id_quirofano,
                    fecha,
                    tipo_quirofano,
                    completado,
                    quirofano_cirujano (
                        cirujanos (nombre, apellido1, apellido2)
                    )
                )
            `)
            .eq('rdq', row.rdq)
            .order('created_at', { ascending: true });

        if (aError) console.error('Error quirofanos para rdq', row.rdq, aError);

        const quirofanos: QuirofanoViaje[] = (asignaciones ?? [])
            .map((asig: any) => {
                const q = asig.quirofanos;
                if (!q) return null;
                const equipo = (q.quirofano_cirujano ?? [])
                    .map((qc: any) => {
                        const c = qc.cirujanos;
                        return `${c.apellido1} ${c.apellido2 ?? ''}, ${c.nombre}`.trim();
                    })
                    .join(' • ');
                return {
                    id_quirofano: q.id_quirofano,
                    fecha: q.fecha,
                    tipo_quirofano: q.tipo_quirofano,
                    completado: q.completado,
                    equipo_medico: equipo,
                } satisfies QuirofanoViaje;
            })
            .filter(Boolean) as QuirofanoViaje[];

        viajes.push({ candidato: parsedCandidato, quirofanos });
    }

    return viajes;
}
