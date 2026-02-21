import { db } from '@/lib/supabase/client';
import { Intervencion, QuirofanoIntervencion } from '@/types/database';

export interface ScoreDetails {
    puntosPriorizable: number;
    puntosOncologico: number;
    puntosGarantiaVencida: number;
    puntosAntiguedad: number;
    puntosTotales: number;
}

export interface PacienteSugerido extends Intervencion {
    scoreDetails: ScoreDetails;
    grupo: 'A' | 'B'; // A: Cirugía Mayor con anestesista, B: Cirugía Local/CMA
}

export const programacionService = {
    /**
     * Recupera todos los pacientes activos de lista_espera (ya desencriptados por una vista/RPC 
     * o se recuperará cifrado según la arquitectura) y aplica el sistema de puntuación.
     * @returns Array ordenado de Pacientes sugeridos
     */
    getSugerencias: async (): Promise<{ grupoA: PacienteSugerido[], grupoB: PacienteSugerido[] }> => {
        // En una arquitectura real con cifrado AES-GCM (como dice arquitectura.md), 
        // traeríamos los registros base y el desencapsulado sucedería donde toque.
        // Aquí asumimos una solicitud directa a lista_espera para simular el tablero.
        const { data: pacientes, error } = await db.raw
            .from('lista_espera')
            .select('*')
            .eq('estado', 'Activo');

        if (error) throw error;
        if (!pacientes) return { grupoA: [], grupoB: [] };

        // Obtener los pacientes que YA están asignados a algún quirófano para no sugerirlos.
        const { data: asignados, error: errAsign } = await db.raw
            .from('quirofano_intervencion')
            .select('rdq');

        if (errAsign) throw errAsign;
        const rdqsAsignados = new Set(asignados?.map((a: any) => a.rdq.toString()) || []);

        const pacientesLibres = pacientes.filter((p: any) => !rdqsAsignados.has(p.rdq.toString()));

        // Aplicar el scoring a los libres
        const sugerencias: PacienteSugerido[] = pacientesLibres.map((paciente: any) => {
            const hoy = new Date();
            const tRegistro = new Date(paciente.t_registro);
            const diasEspera = Math.floor((hoy.getTime() - tRegistro.getTime()) / (1000 * 3600 * 24));

            let pPriorizable = 0;
            let pOncologico = 0;
            let pGarantia = 0;
            let pAntiguedad = diasEspera; // 1 punto por día

            // Reglas Clínicas de puntuación
            if (paciente.priorizable) pPriorizable = 1000;

            const isOncologico = paciente.diagnostico?.toUpperCase().includes('NEOPLASIA MALIGNA');
            if (isOncologico && diasEspera >= 23) {
                pOncologico = 300;
            }

            // Expiración Garantía / Estándar
            const limite = paciente.plazo_garantia || 365;
            if (diasEspera > limite) {
                pGarantia = 500;
            }

            // Determinar si es Grupo A o B basado en t_anestesia
            const isLocal = paciente.t_anestesia?.toLowerCase().includes('local') ||
                paciente.t_anestesia?.toLowerCase().includes('sin');
            const grupo: 'A' | 'B' = isLocal ? 'B' : 'A';

            const puntosTotales = pPriorizable + pOncologico + pGarantia + pAntiguedad;

            return {
                ...paciente,
                grupo,
                scoreDetails: {
                    puntosPriorizable: pPriorizable,
                    puntosOncologico: pOncologico,
                    puntosGarantiaVencida: pGarantia,
                    puntosAntiguedad: pAntiguedad,
                    puntosTotales
                }
            };
        });

        // Filtrado Final por Validación Médica (Anestesia "Apto" en caso del Grupo A)
        // Descartamos los del Grupo A (Mayor) que no tengan el Apto, A MENOS que sean Oncológicos o Priorizables.
        const pacientesValidos = sugerencias.filter(p => {
            if (p.grupo === 'B') return true; // Local pasa directo
            if (p.rdo_preanestesia === 'Apto') return true;
            if (p.scoreDetails.puntosOncologico > 0 || p.scoreDetails.puntosPriorizable > 0) return true; // Excepciones
            return false;
        });

        // Ordenar de mayor a menor puntuación general
        pacientesValidos.sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales);

        return {
            grupoA: pacientesValidos.filter(p => p.grupo === 'A'),
            grupoB: pacientesValidos.filter(p => p.grupo === 'B')
        };
    },

    /**
     * Asigna un paciente (RDQ) a una Sesión de Quirófano en DB.
     * Lanza excepción si el paciente ya estaba en otro quirófano.
     */
    asignarPaciente: async (id_quirofano: string, rdq: number, orden: number = 1): Promise<QuirofanoIntervencion> => {
        const { data, error } = await db.raw
            .from('quirofano_intervencion')
            .insert([{
                id_quirofano,
                rdq,
                orden
            }])
            .select()
            .single();

        if (error) throw error;
        return data as QuirofanoIntervencion;
    },

    /**
     * Elimina a un paciente de la sesión de quirófano en DB (lo "saca" a la lista devuelta).
     */
    desasignarPaciente: async (id_quirofano: string, rdq: number): Promise<void> => {
        const { error } = await db.raw
            .from('quirofano_intervencion')
            .delete()
            .match({ id_quirofano, rdq });

        if (error) throw error;
    }
};
