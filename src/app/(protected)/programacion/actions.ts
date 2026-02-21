'use server';

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
