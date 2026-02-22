import { db } from '@/lib/supabase/client';
import { ListaDistribucion } from '@/types/database';

export const listasService = {
    /**
     * Obtiene todas las listas de distribución ordenadas por nombre.
     */
    getListas: async (): Promise<ListaDistribucion[]> => {
        const { data, error } = await db.raw
            .from('listas_distribucion')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw new Error(`Error fetching listas: ${error.message}`);
        return data || [];
    },

    /**
     * Crea una nueva lista de distribución.
     */
    crearLista: async (
        listaData: Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>
    ): Promise<ListaDistribucion> => {
        const { data, error } = await db.raw
            .from('listas_distribucion')
            .insert(listaData)
            .select()
            .single();

        if (error) throw new Error(`Error creating lista: ${error.message}`);
        return data as ListaDistribucion;
    },

    /**
     * Actualiza una lista de distribución existente.
     */
    actualizarLista: async (
        id: string,
        listaData: Partial<Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<ListaDistribucion> => {
        const { data, error } = await db.raw
            .from('listas_distribucion')
            .update(listaData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Error updating lista: ${error.message}`);
        return data as ListaDistribucion;
    },

    /**
     * Elimina una lista de distribución.
     */
    eliminarLista: async (id: string): Promise<void> => {
        const { error } = await db.raw
            .from('listas_distribucion')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Error deleting lista: ${error.message}`);
    }
};
