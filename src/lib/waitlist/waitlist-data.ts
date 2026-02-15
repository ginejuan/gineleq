/**
 * Waitlist Data Layer
 * 
 * Server-only module for fetching, filtering, and paging waitlist data.
 * Performs in-memory filtering of encrypted fields (Name/NHC).
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { safeDecrypt } from '@/lib/encryption';
import type { PatientRow } from '@/lib/dashboard/dashboard-data';

export interface WaitlistFilters {
    search?: string;
    priorizable?: boolean;
    garantia?: boolean;
    onco?: boolean;
    anestesia?: boolean; // If true: requires anesthesia (NOT local/sin)
    estado?: string; // 'Activo', 'Suspendido', 'Todos'
}

// Extends PatientRow if we add more fields later
export interface WaitlistRow extends PatientRow { }

export interface WaitlistParams {
    page?: number;
    pageSize?: number;
    sortBy?: keyof WaitlistRow;
    sortDir?: 'asc' | 'desc';
    filters?: WaitlistFilters;
}

export interface WaitlistResponse {
    data: WaitlistRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function isOnco(diagnostico: string): boolean {
    return diagnostico.toUpperCase().startsWith('NEOPLASIA MALIGNA');
}

function isLocalOrSinAnestesia(tAnestesia: string): boolean {
    const t = tAnestesia.toUpperCase();
    return t.includes('LOCAL') || t.includes('SIN ANESTESIA');
}

// --------------------------------------------------------------------------
// Main Fetch
// --------------------------------------------------------------------------

export async function getWaitlistData(params: WaitlistParams = {}): Promise<WaitlistResponse> {
    const supabase = createSupabaseAdminClient();

    // Default params
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const sortBy = params.sortBy || 't_registro';
    const sortDir = params.sortDir || 'desc';
    const filters = params.filters || {};

    // 1. Fetch raw data (Active only unless specified)
    // We select ALL active rows to filter in memory.
    let query = supabase
        .from('lista_espera')
        .select(
            'rdq, paciente, nhc, diagnostico, procedimiento, t_registro, ' +
            't_anestesia, rdo_preanestesia, priorizable, suspendida, ' +
            'prioridad, facultativo, estado_garantia, procedimiento_garantia, f_inscripcion, estado'
        );

    // Filter by DB status. 'Activo' is the default in the DB for patients in list.
    // 'Suspendido' in UI usually refers to the 'suspendida' flag, not the 'estado' column (which is 'Pasivo' for deleted rows).
    // So we fetch 'Activo' rows.
    query = query.eq('estado', 'Activo');

    const { data: rows, error } = await query;

    if (error) {
        throw new Error(`Error fetching waitlist: ${error.message}`);
    }

    // 2. Map & Decrypt
    const allRows: WaitlistRow[] = (rows ?? []).map((p: any) => ({
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
        procedimiento_garantia: String(p.procedimiento_garantia ?? ''),
        f_inscripcion: p.f_inscripcion ? String(p.f_inscripcion) : null,
    }));

    // 3. Filter in Memory
    let filtered = allRows.filter(row => {
        // Suspendida flag
        if (filters.estado === 'Suspendido' && !row.suspendida) return false;
        if (filters.estado === 'Activo' && row.suspendida) return false;

        // Text Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matches =
                row.paciente.toLowerCase().includes(q) ||
                row.nhc.toLowerCase().includes(q) ||
                row.diagnostico.toLowerCase().includes(q) ||
                String(row.rdq).includes(q);
            if (!matches) return false;
        }

        // Checkboxes
        if (filters.priorizable && !row.priorizable) return false;
        if (filters.onco && !isOnco(row.diagnostico)) return false;
        if (filters.garantia && row.procedimiento_garantia.toUpperCase() !== 'SI') return false;
        if (filters.anestesia && isLocalOrSinAnestesia(row.t_anestesia)) return false; // "Requieren Anestesia" -> exclude local/sin

        return true;
    });

    // 4. Sort
    filtered.sort((a, b) => {
        // @ts-ignore - dynamic sort key
        const valA = a[sortBy];
        // @ts-ignore
        const valB = b[sortBy];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const cmp = valA > valB ? 1 : -1;
        return sortDir === 'asc' ? cmp : -cmp;
    });

    // 5. Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
        data: paginated,
        total,
        page,
        pageSize,
        totalPages
    };
}
