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
    clinical_filter?: string; // 'onco', 'garantia', 'priorizable', 'anestesia', 'local'
    preanestesia?: string; // 'apto', 'todos'
    alert_filter?: string; // 'preanestesia_caducada', 'todos'
    diagnostico?: string; // Filtro por diagnóstico exacto
    procedimiento?: string; // Filtro por procedimiento exacto
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

function isPreanestesiaCaducada(row: WaitlistRow): boolean {
    // 1. Check if Rdo_preanestesia is "Apto"
    const rdo = (row.rdo_preanestesia || '').toUpperCase();
    if (rdo !== 'APTO') return false;

    // 2. Check if f_preanestesia is > 180 days ago
    if (!row.f_preanestesia) return false;

    const fechaCon = new Date(row.f_preanestesia);
    const today = new Date();

    // Calcula diff in milliseconds
    const diffMs = today.getTime() - fechaCon.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays > 180;
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
            'prioridad, facultativo, estado_garantia, procedimiento_garantia, f_inscripcion, estado, comentarios, observaciones, ' +
            'f_prev_intervencion, f_preanestesia, est_programacion'
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
        comentarios: String(p.comentarios ?? ''),
        observaciones: String(p.observaciones ?? ''),
        f_prev_intervencion: p.f_prev_intervencion ? String(p.f_prev_intervencion) : null,
        f_preanestesia: p.f_preanestesia ? String(p.f_preanestesia) : null,
        est_programacion: String(p.est_programacion ?? ''),
    }));

    // 3. Filter in Memory
    const filtered = allRows.filter(row => {
        // Alertas Filter (Primary for Alerts view)
        if (filters.alert_filter === 'preanestesia_caducada') {
            if (!isPreanestesiaCaducada(row)) return false;
        }

        // Preanestesia Filter
        if (filters.preanestesia === 'apto') {
            const rdo = (row.rdo_preanestesia || '').toUpperCase();
            if (rdo !== 'APTO') return false;
        }

        // Note: We are no longer filtering by 'suspendida' status here, as the user replaced the 'Estado' filter.
        // This means suspended patients will appear in the list (marked by their status badge/text).


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

        // Clinical Filters (Single Selection)
        switch (filters.clinical_filter) {
            case 'onco':
                if (!isOnco(row.diagnostico)) return false;
                break;
            case 'garantia':
                if (row.procedimiento_garantia.toUpperCase() !== 'SI') return false;
                break;
            case 'priorizable':
                if (!row.priorizable) return false;
                break;
            case 'anestesia':
                // Requieren anestesia -> Exclude Local/Sin
                if (isLocalOrSinAnestesia(row.t_anestesia)) return false;
                break;
            case 'local':
                // Only Local/Sin
                if (!isLocalOrSinAnestesia(row.t_anestesia)) return false;
                break;
            default:
                // 'all' or undefined -> No filter
                break;
        }

        // Diagnostico filter
        if (filters.diagnostico && filters.diagnostico !== 'todos') {
            if (row.diagnostico !== filters.diagnostico) return false;
        }

        // Procedimiento filter
        if (filters.procedimiento && filters.procedimiento !== 'todos') {
            if (row.procedimiento !== filters.procedimiento) return false;
        }

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

// --------------------------------------------------------------------------
// Filter Options (valores únicos para dropdowns)
// --------------------------------------------------------------------------

export interface WaitlistFilterOptions {
    diagnosticos: string[];
    procedimientos: string[];
}

/**
 * Obtiene los valores únicos de diagnóstico y procedimiento
 * para poblar los selects de filtrado en la UI.
 */
export async function getWaitlistFilterOptions(): Promise<WaitlistFilterOptions> {
    const supabase = createSupabaseAdminClient();

    const { data: rows, error } = await supabase
        .from('lista_espera')
        .select('diagnostico, procedimiento')
        .eq('estado', 'Activo');

    if (error) {
        throw new Error(`Error fetching filter options: ${error.message}`);
    }

    const diagnosticoSet = new Set<string>();
    const procedimientoSet = new Set<string>();

    for (const row of rows ?? []) {
        const diag = String(row.diagnostico ?? '').trim();
        const proc = String(row.procedimiento ?? '').trim();
        if (diag) diagnosticoSet.add(diag);
        if (proc) procedimientoSet.add(proc);
    }

    return {
        diagnosticos: [...diagnosticoSet].sort((a, b) => a.localeCompare(b, 'es')),
        procedimientos: [...procedimientoSet].sort((a, b) => a.localeCompare(b, 'es')),
    };
}
