import { db } from '../lib/supabase/client';
import { Cirujano } from '../types/database';

/**
 * Servicio para la gestión de cirujanos (CRUD).
 * Principio: SoC (Separación de Lógica de Negocio y UI)
 */

export const cirujanosService = {
    /**
     * Obtiene todos los cirujanos ordenados por nombre.
     */
    async getCirujanos(): Promise<Cirujano[]> {
        const { data, error } = await db.raw
            .from('cirujanos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('[CirujanosService] Error fetching cirujanos:', error);
            throw new Error('No se pudieron obtener los cirujanos.');
        }

        return (data || []) as Cirujano[];
    },

    /**
     * Crea un nuevo cirujano en la base de datos.
     */
    async createCirujano(
        cirujanoInfo: Omit<Cirujano, 'id_cirujano' | 'created_at' | 'updated_at'>
    ): Promise<Cirujano> {
        const { data, error } = await db.raw
            .from('cirujanos')
            .insert([cirujanoInfo])
            .select()
            .single();

        if (error) {
            console.error('[CirujanosService] Error creating cirujano:', error);
            throw new Error(`Error al crear el cirujano: ${error.message}`);
        }

        return data as Cirujano;
    },

    /**
     * Actualiza los datos de un cirujano existente.
     */
    async updateCirujano(
        id: string,
        cirujanoInfo: Partial<Omit<Cirujano, 'id_cirujano' | 'created_at' | 'updated_at'>>
    ): Promise<Cirujano> {
        const { data, error } = await db.raw
            .from('cirujanos')
            .update(cirujanoInfo)
            .eq('id_cirujano', id)
            .select()
            .single();

        if (error) {
            console.error('[CirujanosService] Error updating cirujano:', error);
            throw new Error(`Error al actualizar el cirujano: ${error.message}`);
        }

        return data as Cirujano;
    },

    /**
     * Elimina un cirujano de la base de datos.
     */
    async deleteCirujano(id: string): Promise<void> {
        const { error } = await db.raw
            .from('cirujanos')
            .delete()
            .eq('id_cirujano', id);

        if (error) {
            console.error('[CirujanosService] Error deleting cirujano:', error);
            throw new Error(`Error al eliminar el cirujano: ${error.message}`);
        }
    },
};
