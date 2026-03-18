import { db } from '../lib/supabase/client';
import { createBlindIndex, decrypt } from '../lib/crypto/encryption';
import { Intervencion } from '../types/database';

export interface ViajePacienteItem {
    rdq: string;
    fecha_registro: string;
    dias_espera_actual: number;
    quirofanos: Array<{
        id_quirofano: string;
        fecha: string;
        tipo_quirofano: string;
        completado: boolean;
        equipo_medico: string; // Formatting later or here
    }>;
}

export const trazabilidadService = {
    /**
     * Busca pacientes por RDQ o NHC.
     */
    buscarPacientes: async (query: string): Promise<Intervencion[]> => {
        const isNumeric = /^\d+$/.test(query);
        
        let dbQuery = db.raw.from('lista_espera').select('*');

        if (isNumeric) {
            // Buscamos tanto en rdq como en nhc por si acaso (aunque nhc usa blind index, no partial)
            // Para el NHC necesitamos el blind index exacto
            const blindHash = await createBlindIndex(query);
            dbQuery = dbQuery.or(`rdq.eq.${query},nhc_blind_index.eq.${blindHash}`);
        } else {
            // Asumimos que podría ser un nombre o NHC alfanumérico
            const blindHash = await createBlindIndex(query.toUpperCase().trim());
            dbQuery = dbQuery.or(`paciente_blind_index.eq.${blindHash},nhc_blind_index.eq.${blindHash}`);
        }

        const { data, error } = await dbQuery.limit(20);

        if (error) {
            console.error('Error buscando pacientes:', error);
            throw new Error('Error al buscar pacientes.');
        }

        // Desciframos
        const descifrados = await Promise.all(
            (data || []).map(async (row) => {
                const pacienteDec = row.paciente_encrypted && row.paciente_iv 
                    ? await decrypt({ ciphertext: row.paciente_encrypted, iv: row.paciente_iv }) 
                    : '';
                const nhcDec = row.nhc_encrypted && row.nhc_iv 
                    ? await decrypt({ ciphertext: row.nhc_encrypted, iv: row.nhc_iv }) 
                    : '';

                return {
                    ...row,
                    paciente_encrypted: pacienteDec, // Reemplazamos temporalmente para la UI
                    nhc_encrypted: nhcDec
                } as Intervencion;
            })
        );

        return descifrados;
    },

    /**
     * Obtiene todo el viaje quirúrgico dado un blind index de NHC
     * (Todos los RDQs de ese paciente y sus quirófanos)
     */
    getViajePorNHC: async (nhcBlindIndex: string) => {
        // 1. Obtener todos los registros en lista de espera para ese NHC
        const { data: intervenciones, error: rdqError } = await db.raw
            .from('lista_espera')
            .select('*')
            .eq('nhc_blind_index', nhcBlindIndex)
            .order('created_at', { ascending: false });

        if (rdqError) throw new Error(rdqError.message);

        // 2. Para cada RDQ, obtener sus asignaciones a quirófano
        const results = [];
        
        for (const intervencion of intervenciones || []) {
            const pacienteDec = intervencion.paciente_encrypted && intervencion.paciente_iv 
                ? await decrypt({ ciphertext: intervencion.paciente_encrypted, iv: intervencion.paciente_iv }) 
                : '';
            const nhcDec = intervencion.nhc_encrypted && intervencion.nhc_iv 
                ? await decrypt({ ciphertext: intervencion.nhc_encrypted, iv: intervencion.nhc_iv }) 
                : '';

            intervencion.paciente_encrypted = pacienteDec;
            intervencion.nhc_encrypted = nhcDec;

            const { data: asignaciones, error: asigError } = await db.raw
                .from('quirofano_intervencion')
                .select(`
                    id_quirofano,
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
                .eq('rdq', intervencion.rdq)
                .order('created_at', { ascending: true }); // Cronológico

            if (asigError) console.error('Error fetching assignments:', asigError);

            const quirofanosMapped = (asignaciones || [])
                .map((asig: any) => {
                    const qData = asig.quirofanos;
                    if (!qData) return null;
                    const cirujanosStr = (qData.quirofano_cirujano || []).map((qc: any) => {
                        const c = qc.cirujanos;
                        return `${c.apellido1} ${c.apellido2 || ''}, ${c.nombre}`;
                    }).join(' • ');

                    return {
                        id_quirofano: qData.id_quirofano,
                        fecha: qData.fecha,
                        tipo_quirofano: qData.tipo_quirofano,
                        completado: qData.completado,
                        equipo_medico: cirujanosStr
                    };
                })
                .filter(Boolean);

            results.push({
                intervencion,
                quirofanos: quirofanosMapped
            });
        }

        return results;
    }
};


