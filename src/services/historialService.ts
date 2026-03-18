import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const historialService = {
    /**
     * Obtiene todos los quirófanos anteriores a hoy, o que hayan sido marcados como completados.
     * Incluye la información de los cirujanos asignados.
     */
    getHistorialQuirofanos: async () => {
        const supabase = createSupabaseAdminClient();
        
        // Obtener fecha de hoy para comparar (YYYY-MM-DD)
        const hoy = new Date();
        // Ajuste horario local
        hoy.setHours(0, 0, 0, 0);
        const hoyStr = hoy.toISOString().split('T')[0];

        // Consultar quirófanos: fecha < hoy o completado = true
        // Se ordena de forma descendente (del más reciente al más antiguo)
        const { data, error } = await supabase
            .from('quirofanos')
            .select(`
                *,
                quirofano_cirujano (
                    cirujanos (*)
                ),
                quirofanos_documentos (*)
            `)
            .or(`fecha.lt.${hoyStr},completado.eq.true`)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error obteniendo historial de quirófanos:', error);
            throw new Error(`Error en la base de datos: ${error.message}`);
        }

        return data || [];
    }
};
