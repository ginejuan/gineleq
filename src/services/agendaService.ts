import { db } from '../lib/supabase/client';
import { Quirofano, QuirofanoConCirujanos } from '../types/database';

/**
 * Servicio para la gestión de la agenda de quirófanos.
 * Principio: SoC (Separación de Lógica de Negocio y UI)
 */

export const agendaService = {
    /**
     * Obtiene la agenda de quirófanos, incluyendo los cirujanos asignados.
     * Si se provee rango de fechas, filtra por dicho rango de 'fecha'.
     */
    async getAgenda(startDate?: string, endDate?: string): Promise<QuirofanoConCirujanos[]> {
        let query = db.raw
            .from('quirofanos')
            .select(`
        *,
        quirofano_cirujano (
          cirujanos (
            *
          )
        )
      `)
            .order('fecha', { ascending: true });

        if (startDate) {
            query = query.gte('fecha', startDate);
        }
        if (endDate) {
            query = query.lte('fecha', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[AgendaService] Error fetching agenda:', error);
            throw new Error('No se pudo obtener la agenda de quirófanos.');
        }

        return (data || []) as QuirofanoConCirujanos[];
    },

    /**
     * Crea un nuevo quirófano y asocia los cirujanos indicados.
     * Se inserta primero en `quirofanos` y luego en `quirofano_cirujano`.
     */
    async createQuirofano(
        quirofanoData: Omit<Quirofano, 'id_quirofano' | 'created_at' | 'updated_at'>,
        cirujanoIds: string[]
    ): Promise<Quirofano> {
        // 1. Insertar el quirófano
        const { data: newQuirofano, error: quirofanoError } = await db.raw
            .from('quirofanos')
            .insert([quirofanoData])
            .select()
            .single();

        if (quirofanoError || !newQuirofano) {
            console.error('[AgendaService] Error creating quirofano:', quirofanoError);
            throw new Error(`Error al crear el quirófano: ${quirofanoError?.message}`);
        }

        // 2. Asociar cirujanos
        if (cirujanoIds.length > 0) {
            const recordsToInsert = cirujanoIds.map((idCirujano) => ({
                id_quirofano: newQuirofano.id_quirofano,
                id_cirujano: idCirujano,
            }));

            const { error: vinculacionError } = await db.raw
                .from('quirofano_cirujano')
                .insert(recordsToInsert);

            if (vinculacionError) {
                console.error('[AgendaService] Error linking cirujanos:', vinculacionError);
                // Fallback: Si falla la asociación, tal vez deberíamos limpiar el quirófano (pseudo-transacción)
                await db.raw.from('quirofanos').delete().eq('id_quirofano', newQuirofano.id_quirofano);
                throw new Error('Error al vincular los cirujanos. Se ha revertido el quirófano.');
            }
        }

        return newQuirofano as Quirofano;
    },

    /**
     * Actualiza un quirófano existente y reemplaza los cirujanos asignados.
     */
    async updateQuirofano(
        id: string,
        quirofanoData: Partial<Omit<Quirofano, 'id_quirofano' | 'created_at' | 'updated_at'>>,
        cirujanoIds: string[]
    ): Promise<Quirofano> {
        // 1. Actualizar el quirófano
        const { data: updatedQuirofano, error: quirofanoError } = await db.raw
            .from('quirofanos')
            .update(quirofanoData)
            .eq('id_quirofano', id)
            .select()
            .single();

        if (quirofanoError || !updatedQuirofano) {
            console.error('[AgendaService] Error updating quirofano:', quirofanoError);
            throw new Error(`Error al actualizar el quirófano: ${quirofanoError?.message}`);
        }

        // 2. Limpiar asociaciones anteriores y crear las nuevas
        await db.raw.from('quirofano_cirujano').delete().eq('id_quirofano', id);

        if (cirujanoIds.length > 0) {
            const recordsToInsert = cirujanoIds.map((idCirujano) => ({
                id_quirofano: id,
                id_cirujano: idCirujano,
            }));

            const { error: vinculacionError } = await db.raw
                .from('quirofano_cirujano')
                .insert(recordsToInsert);

            if (vinculacionError) {
                console.error('[AgendaService] Error linking cirujanos on update:', vinculacionError);
                throw new Error('Error al vincular los cirujanos tras actualizar.');
            }
        }

        return updatedQuirofano as Quirofano;
    },

    /**
     * Elimina un quirófano programado.
     * (La base de datos debería tener ON DELETE CASCADE en la FK id_quirofano de quirofano_cirujano,
     *  si no, habrá que borrar a mano, pero esto depende del setup en supabase).
     */
    async deleteQuirofano(id: string): Promise<void> {
        const { error } = await db.raw
            .from('quirofanos')
            .delete()
            .eq('id_quirofano', id);

        if (error) {
            console.error('[AgendaService] Error deleting quirofano:', error);
            throw new Error(`Error al eliminar el quirófano: ${error.message}`);
        }
    },

    /**
     * Marca un quirófano como enviado por email, guardando la fecha y hora actual.
     */
    async marcarEmailEnviado(id: string): Promise<void> {
        const { error } = await db.raw
            .from('quirofanos')
            .update({
                email_enviado: true,
                f_email_enviado: new Date().toISOString()
            })
            .eq('id_quirofano', id);

        if (error) {
            console.error('[AgendaService] Error marking email as sent:', error);
            throw new Error(`Error al marcar el email como enviado: ${error.message}`);
        }
    }
};
