import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Intervencion, QuirofanoIntervencion } from '@/types/database';
import { decrypt } from '@/lib/encryption';

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
    paciente?: string; // Nombre desencriptado para visualización
}

function safeDecrypt(ciphertext: string): string {
    if (!ciphertext || ciphertext.trim() === '') return '';
    try {
        return decrypt(ciphertext);
    } catch {
        // If decryption fails (e.g. not encrypted), return as-is
        return ciphertext;
    }
}

export const programacionService = {
    /**
     * Recupera todos los pacientes activos de lista_espera (ya desencriptados por una vista/RPC 
     * o se recuperará cifrado según la arquitectura) y aplica el sistema de puntuación.
     * @returns Array ordenado de Pacientes sugeridos
     */
    getSugerencias: async (): Promise<{ grupoA: PacienteSugerido[], grupoB: PacienteSugerido[] }> => {
        const supabase = createSupabaseAdminClient();

        // En una arquitectura real con cifrado AES-GCM (como dice arquitectura.md), 
        // traeríamos los registros base y el desencapsulado sucedería donde toque.
        // Aquí asumimos una solicitud directa a lista_espera para simular el tablero.
        const { data: pacientes, error } = await supabase
            .from('lista_espera')
            .select('*')
            .eq('estado', 'Activo');

        if (error) throw error;
        if (!pacientes) return { grupoA: [], grupoB: [] };

        // Obtener los pacientes que YA están asignados a algún quirófano para no sugerirlos.
        const { data: asignados, error: errAsign } = await supabase
            .from('quirofano_intervencion')
            .select('rdq');

        if (errAsign) throw errAsign;
        const rdqsAsignados = new Set(asignados?.map((a: any) => a.rdq.toString()) || []);

        const pacientesLibres = pacientes.filter((p: any) => !rdqsAsignados.has(p.rdq.toString()));
        console.log(`[DEBUG SCORING] Pacientes Totales Activos: ${pacientes.length}`);
        console.log(`[DEBUG SCORING] Pacientes Libres: ${pacientesLibres.length}`);

        // Aplicar el scoring a los libres
        const sugerencias: PacienteSugerido[] = pacientesLibres.map((paciente: any) => {
            const hoy = new Date();
            let diasEspera = 0;

            if (paciente.t_registro) {
                const tRegistro = new Date(paciente.t_registro);
                if (!isNaN(tRegistro.getTime())) {
                    diasEspera = Math.floor((hoy.getTime() - tRegistro.getTime()) / (1000 * 3600 * 24));
                }
            } else if (paciente.created_at) {
                const tRegistro = new Date(paciente.created_at);
                if (!isNaN(tRegistro.getTime())) {
                    diasEspera = Math.floor((hoy.getTime() - tRegistro.getTime()) / (1000 * 3600 * 24));
                }
            }

            // Prevent negative days if there's any timezone weirdness
            if (diasEspera < 0) diasEspera = 0;

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
                paciente: safeDecrypt(String(paciente.paciente ?? '')),
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
        const pacientesValidos = sugerencias.filter((p: any) => {
            if (p.grupo === 'B') return true; // Local pasa directo

            // Check for strict "Apto" equality. 
            // Also checking if the capitalization is correct "APTO", "Apto", etc
            if (p.rdo_preanestesia?.toLowerCase() === 'apto') return true;

            if (p.scoreDetails.puntosOncologico > 0 || p.scoreDetails.puntosPriorizable > 0) return true; // Excepciones
            return false;
        });

        console.log(`[DEBUG SCORING] Pacientes Válidos Finales: ${pacientesValidos.length}`);
        if (pacientesValidos.length === 0 && sugerencias.length > 0) {
            console.log(`[DEBUG SCORING] Ejemplo Grupo A filtrado rdo_preanestesia: "${sugerencias[0]?.rdo_preanestesia}"`);
        }

        // Ordenar de mayor a menor puntuación general
        pacientesValidos.sort((a: any, b: any) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales);

        return {
            grupoA: pacientesValidos.filter(p => p.grupo === 'A'),
            grupoB: pacientesValidos.filter(p => p.grupo === 'B')
        };
    },

    /**
     * Recupera los pacientes asignados a una lista de Quirófanos y los formatea
     */
    getAsignaciones: async (quirofanoIds: string[]): Promise<Record<string, PacienteSugerido[]>> => {
        const supabase = createSupabaseAdminClient();

        const result: Record<string, PacienteSugerido[]> = {};
        quirofanoIds.forEach(id => result[id] = []);

        if (quirofanoIds.length === 0) return result;

        const { data: asignaciones, error } = await supabase
            .from('quirofano_intervencion')
            .select('id_quirofano, rdq, orden')
            .in('id_quirofano', quirofanoIds)
            .order('orden', { ascending: true });

        if (error) throw error;
        if (!asignaciones || asignaciones.length === 0) return result;

        const rdqs = asignaciones.map((a: any) => a.rdq);
        const { data: pacientes, error: pacError } = await supabase
            .from('lista_espera')
            .select('*')
            .in('rdq', rdqs);

        if (pacError) throw pacError;

        const pacMap = new Map();
        pacientes?.forEach((p: any) => pacMap.set(p.rdq.toString(), p));

        for (const asig of asignaciones) {
            const pData = pacMap.get(asig.rdq.toString());
            if (pData) {
                const isLocal = pData.t_anestesia?.toLowerCase().includes('local') ||
                    pData.t_anestesia?.toLowerCase().includes('sin');
                const grupo = isLocal ? 'B' : 'A';

                const hoy = new Date();
                let diasEspera = 0;

                if (pData.t_registro) {
                    const tRegistro = new Date(pData.t_registro);
                    if (!isNaN(tRegistro.getTime())) {
                        diasEspera = Math.floor((hoy.getTime() - tRegistro.getTime()) / (1000 * 3600 * 24));
                    }
                } else if (pData.created_at) {
                    const tRegistro = new Date(pData.created_at);
                    if (!isNaN(tRegistro.getTime())) {
                        diasEspera = Math.floor((hoy.getTime() - tRegistro.getTime()) / (1000 * 3600 * 24));
                    }
                }

                if (diasEspera < 0) diasEspera = 0;

                let pPriorizable = 0;
                let pOncologico = 0;
                let pGarantia = 0;
                let pAntiguedad = diasEspera;

                if (pData.priorizable) pPriorizable = 1000;
                const isOncologico = pData.diagnostico?.toUpperCase().includes('NEOPLASIA MALIGNA');
                if (isOncologico && diasEspera >= 23) pOncologico = 300;
                const limite = pData.plazo_garantia || 365;
                if (diasEspera > limite) pGarantia = 500;

                const puntosTotales = pPriorizable + pOncologico + pGarantia + pAntiguedad;

                result[asig.id_quirofano].push({
                    ...pData,
                    paciente: safeDecrypt(String(pData.paciente ?? '')),
                    grupo,
                    scoreDetails: {
                        puntosPriorizable: pPriorizable,
                        puntosOncologico: pOncologico,
                        puntosGarantiaVencida: pGarantia,
                        puntosAntiguedad: pAntiguedad,
                        puntosTotales
                    }
                });
            }
        }

        return result;
    },

    /**
     * Asigna un paciente (RDQ) a una Sesión de Quirófano en DB.
     * Lanza excepción si el paciente ya estaba en otro quirófano.
     */
    asignarPaciente: async (id_quirofano: string, rdq: number, orden: number = 1): Promise<QuirofanoIntervencion> => {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
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
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from('quirofano_intervencion')
            .delete()
            .match({ id_quirofano, rdq });

        if (error) throw error;
    },

    /**
     * Actualiza el orden (secuencia) de las intervenciones dentro de un quirófano específico
     */
    actualizarOrden: async (id_quirofano: string, rdqsOrdenados: number[]): Promise<void> => {
        const supabase = createSupabaseAdminClient();

        // Ejecutamos las actualizaciones en serie para asegurar integridad
        for (let i = 0; i < rdqsOrdenados.length; i++) {
            const rdq = rdqsOrdenados[i];
            const { error } = await supabase
                .from('quirofano_intervencion')
                .update({ orden: i + 1 })
                .match({ id_quirofano, rdq });

            if (error) {
                console.error(`Error actualizando orden para RDQ ${rdq}:`, error);
                throw error;
            }
        }
    }
};
