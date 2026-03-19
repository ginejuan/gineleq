import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Intervencion, QuirofanoIntervencion } from '@/types/database';
import { decrypt } from '@/lib/encryption';

export interface ScoreDetails {
    puntosPriorizable: number;
    puntosOncologico: number;
    puntosGarantiaVencida: number;
    puntosProximoVencimiento: number;
    puntosAntiguedad: number;
    puntosTotales: number;
}

export interface PacienteSugerido extends Intervencion {
    scoreDetails: ScoreDetails;
    grupo: 'A' | 'B'; // A: Cirugía Mayor con anestesista, B: Cirugía Local/CMA
    paciente?: string; // Nombre desencriptado para visualización
    nhc?: string; // NHC desencriptado
    telefonos?: string; // Teléfonos desencriptados
    centro?: string; // Centro de procedencia
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

export function calcularScoring(paciente: any): PacienteSugerido {
    const tieneGarantia = paciente.procedimiento_garantia?.trim().toUpperCase() === 'SI';
    let diasEspera = tieneGarantia ? (Number(paciente.t_garantia) || 0) : (Number(paciente.t_registro) || 0);

    // Prevent negative days just in case
    if (diasEspera < 0) diasEspera = 0;

    let pPriorizable = 0;
    let pOncologico = 0;
    let pGarantia = 0;
    let pAntiguedad = diasEspera;

    // Reglas Clínicas de puntuación
    if (paciente.priorizable) pPriorizable = 1000;

    // Puntos por Prioridad (1, 2, 3) - Alta importancia para el usuario
    const prioridadStr = String(paciente.prioridad || '').trim();
    if (prioridadStr === '1') pPriorizable += 5000;
    else if (prioridadStr === '2') pPriorizable += 3000;
    else if (prioridadStr === '3') pPriorizable += 1000;

    // Puntos por "Prioridad Preferente"
    if (paciente.prioridad?.trim().toUpperCase() === 'PREFERENTE') {
        pPriorizable += 200;
    }

    const isOncologico = paciente.diagnostico?.trim().toUpperCase().startsWith('NEOPLASIA MALIGNA');
    if (isOncologico) {
        // Base de puntos alta para oncología para asegurar visibilidad
        pOncologico = 2000;
        // Puntos extra por espera en oncología
        if (diasEspera >= 23) pOncologico += 300;
    }

    const limite = paciente.plazo_garantia || 365;
    let pProximoVencimiento = 0;
    if (diasEspera > limite) {
        pGarantia = 500;
    } else if (diasEspera > (limite - 30)) {
        pProximoVencimiento = 350;
    }

    const isLocal = paciente.t_anestesia?.toLowerCase().includes('local') ||
        paciente.t_anestesia?.toLowerCase().includes('sin');
    const grupo: 'A' | 'B' = isLocal ? 'B' : 'A';

    const puntosTotales = pPriorizable + pOncologico + pGarantia + pProximoVencimiento + pAntiguedad;

    const tContacto = safeDecrypt(String(paciente.telefonos_contacto ?? ''));
    const tBdu = safeDecrypt(String(paciente.telefonos_bdu ?? ''));
    const telefonos = [tContacto, tBdu].filter(t => t.trim() !== '').join(' / ');

    return {
        ...paciente,
        paciente: safeDecrypt(String(paciente.paciente ?? '')),
        nhc: safeDecrypt(String(paciente.nhc ?? '')),
        telefonos,
        grupo,
        scoreDetails: {
            puntosPriorizable: pPriorizable,
            puntosOncologico: pOncologico,
            puntosGarantiaVencida: pGarantia,
            puntosProximoVencimiento: pProximoVencimiento,
            puntosAntiguedad: pAntiguedad,
            puntosTotales
        }
    };
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

        // El usuario solicitó ver las pacientes no programadas.
        // Filtramos solo aquellas que ya tienen una sesión de quirófano asignada para HOY o el FUTURO.
        // Pacientes con asignaciones pasadas que sigan en estado 'Activo' deben aparecer para ser reprogramadas.
        const hoy = new Date().toISOString().split('T')[0];
        const { data: asignacionesFuturas, error: errAsign } = await supabase
            .from('quirofano_intervencion')
            .select('rdq, quirofanos!inner(fecha)')
            .gte('quirofanos.fecha', hoy);

        if (errAsign) {
            console.error('Error recuperando asignaciones futuras:', errAsign);
            // Si hay error, por seguridad no filtramos nada para asegurar visibilidad
        }
        
        const rdqsProgramados = new Set(asignacionesFuturas?.map((a: any) => a.rdq.toString()) || []);
        const pacientesLibres = pacientes.filter((p: any) => !rdqsProgramados.has(p.rdq.toString()));
        
        console.log(`[DEBUG SCORING] Pacientes Totales Activos: ${pacientes.length}`);
        console.log(`[DEBUG SCORING] Pacientes Libres (No programados hoy/futuro): ${pacientesLibres.length}`);

        // Aplicar el scoring a los libres
        const sugerencias: PacienteSugerido[] = pacientesLibres.map((paciente: any) => calcularScoring(paciente));

        // Filtrado Final por Validación Médica
        // El usuario solicitó que aparezcan TODAS las pacientes de la lista de espera activa,
        // incluso aquellas de Grupo A que no tienen 'Apto' en preanestesia y tienen 0 puntos.
        // Se elimina el filtro restrictivo anterior.
        const pacientesValidos = sugerencias;

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
                result[asig.id_quirofano].push(calcularScoring(pData));
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

        // 1. Obtener la fecha del quirófano
        const { data: quirofano, error: qError } = await supabase
            .from('quirofanos')
            .select('fecha')
            .eq('id_quirofano', id_quirofano)
            .single();

        if (qError) throw qError;

        // 2. Limpiar cualquier asignación previa del mismo paciente (RDQ)
        // Esto permite que el paciente se "mueva" de un quirófano a otro si ya estaba programado.
        const { error: delError } = await supabase
            .from('quirofano_intervencion')
            .delete()
            .eq('rdq', rdq);

        if (delError) {
            console.error(`Error eliminando asignación previa para RDQ ${rdq}:`, delError);
            // Continuamos, el insert fallará si hay un índice único, o se duplicará si no lo hay.
            // Pero lo ideal es intentar limpiar.
        }

        // 3. Asignar paciente al nuevo quirófano
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

        // 3. Actualizar f_prev_intervencion en lista_espera
        if (quirofano?.fecha) {
            const { error: updateError } = await supabase
                .from('lista_espera')
                .update({ f_prev_intervencion: quirofano.fecha })
                .eq('rdq', rdq);

            if (updateError) {
                console.error(`Error actualizando f_prev_intervencion para RDQ ${rdq}:`, updateError);
            }
        }

        return data as QuirofanoIntervencion;
    },

    desasignarPaciente: async (id_quirofano: string, rdq: number): Promise<void> => {
        const supabase = createSupabaseAdminClient();

        // 1. Quitar paciente del quirófano
        const { error } = await supabase
            .from('quirofano_intervencion')
            .delete()
            .match({ id_quirofano, rdq });

        if (error) throw error;

        // 2. Limpiar f_prev_intervencion en lista_espera
        const { error: updateError } = await supabase
            .from('lista_espera')
            .update({ f_prev_intervencion: null })
            .eq('rdq', rdq);

        if (updateError) {
            console.error(`Error limpiando f_prev_intervencion para RDQ ${rdq}:`, updateError);
        }
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
    },

    /**
     * Cambia el estado 'completado' de un quirófano
     */
    toggleCompletado: async (id_quirofano: string, completado: boolean): Promise<void> => {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from('quirofanos')
            .update({ completado })
            .eq('id_quirofano', id_quirofano);

        if (error) {
            console.error(`Error toggling completado for quirofano ${id_quirofano}:`, error);
            throw error;
        }
    },

    /**
     * Obtiene un quirófano específico con sus cirujanos y los pacientes asignados en el orden correcto
     */
    getQuirofanoCompleto: async (id_quirofano: string): Promise<{ quirofano: any, pacientes: PacienteSugerido[] }> => {
        const supabase = createSupabaseAdminClient();

        // 1. Obtener datos del quirófano y cirujanos
        const { data: quirofanoData, error: qError } = await supabase
            .from('quirofanos')
            .select(`
                *,
                quirofano_cirujano (
                    cirujanos (*)
                )
            `)
            .eq('id_quirofano', id_quirofano)
            .single();

        if (qError) throw new Error(`Error fetching quirofano: ${qError.message}`);

        // 2. Obtener asignaciones (solo los de este quirófano)
        const asignacionesMap = await programacionService.getAsignaciones([id_quirofano]);
        const pacientesAsignados = asignacionesMap[id_quirofano] || [];

        return {
            quirofano: quirofanoData,
            pacientes: pacientesAsignados
        };
    }
};
