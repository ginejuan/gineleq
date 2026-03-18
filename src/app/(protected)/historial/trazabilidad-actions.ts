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
    intervencion_propuesta: string;
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
        intervencion_propuesta: row.intervencion_propuesta ?? '',
        estado: row.estado ?? '',
        t_registro: Number(row.t_registro ?? 0),
        created_at: row.created_at ?? '',
        tieneNhc,
    };
}

/**
 * PASO 1 — Busca candidatas.
 * Si query es numérico → busca por RDQ exacto.
 * Si es texto → descifra todos y filtra por nombre (parcial, case-insensitive).
 */
export async function buscarCandidatasAction(query: string): Promise<PacienteCandidato[]> {
    const supabase = createSupabaseAdminClient();
    query = query.trim();

    const isNumeric = /^\d+$/.test(query);

    if (isNumeric) {
        // Búsqueda exacta por RDQ
        const { data, error } = await supabase
            .from('lista_espera')
            .select('*')
            .eq('rdq', query)
            .limit(1);

        if (error) throw new Error(error.message);
        return (data ?? []).map(decodeRow);
    }

    // Búsqueda por nombre: descifrar todos y filtrar en servidor
    // (lista de espera de ginecología suele ser < 1000 pacientes → asumible)
    const { data, error } = await supabase
        .from('lista_espera')
        .select('rdq, paciente, nhc, nhc_blind_index, paciente_blind_index, diagnostico, intervencion_propuesta, estado, t_registro, created_at')
        .not('estado', 'eq', 'Eliminado'); // Excluimos borrados históricos

    if (error) throw new Error(error.message);

    const needle = normalizeStr(query);

    const matches = (data ?? [])
        .map(decodeRow)
        .filter(c => {
            const name = normalizeStr(c.paciente);
            return name.includes(needle);
        });

    // Ordenamos: primero los que empiezan por el término, luego el resto
    matches.sort((a, b) => {
        const an = normalizeStr(a.paciente);
        const bn = normalizeStr(b.paciente);
        const q = normalizeStr(query);
        if (an.startsWith(q) && !bn.startsWith(q)) return -1;
        if (!an.startsWith(q) && bn.startsWith(q)) return 1;
        return an.localeCompare(bn);
    });

    return matches.slice(0, 30);
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
