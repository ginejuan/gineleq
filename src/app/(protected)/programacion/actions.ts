'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

import { programacionService, PacienteSugerido, ScoreDetails } from '@/services/programacionService';
import { QuirofanoIntervencion } from '@/types/database';

export async function fetchSugerenciasAccion(): Promise<{ grupoA: PacienteSugerido[], grupoB: PacienteSugerido[] }> {
    return await programacionService.getSugerencias();
}

export async function asignarPacienteAccion(id_quirofano: string, rdq: number, orden: number = 1): Promise<QuirofanoIntervencion> {
    return await programacionService.asignarPaciente(id_quirofano, rdq, orden);
}

export async function desasignarPacienteAccion(id_quirofano: string, rdq: number): Promise<void> {
    return await programacionService.desasignarPaciente(id_quirofano, rdq);
}

export async function actualizarOrdenPacientesAccion(id_quirofano: string, rdqsOrdenados: number[]): Promise<void> {
    return await programacionService.actualizarOrden(id_quirofano, rdqsOrdenados);
}

export async function getAsignacionesAccion(quirofanoIds: string[]): Promise<Record<string, PacienteSugerido[]>> {
    return await programacionService.getAsignaciones(quirofanoIds);
}

export async function toggleQuirofanoCompletadoAccion(id_quirofano: string, completado: boolean): Promise<void> {
    return await programacionService.toggleCompletado(id_quirofano, completado);
}

export async function marcarEmailEnviadoAccion(id_quirofano: string): Promise<void> {
    const { agendaService } = await import('@/services/agendaService');
    return await agendaService.marcarEmailEnviado(id_quirofano);
}

export async function guardarParteEditadoAccion(id_quirofano: string, htmlContent: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const filePath = `${id_quirofano}/edited_parte.html`;

    const { error } = await supabase.storage
        .from('partes_quirofano')
        .upload(filePath, htmlContent, {
            contentType: 'text/html',
            upsert: true,
            cacheControl: '0'
        });

    if (error) {
        console.error("Error saving edited parte to storage", error);
        throw new Error(`Error guardando borrador: ${error.message}`);
    }
}

export async function cargarParteEditadoAccion(id_quirofano: string): Promise<string | null> {
    const supabase = createSupabaseAdminClient();
    const filePath = `${id_quirofano}/edited_parte.html`;

    const { data, error } = await supabase.storage
        .from('partes_quirofano')
        .download(filePath);

    if (error) {
        // Archivo no existe o error
        return null;
    }

    return await data.text();
}
