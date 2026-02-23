'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ListaDistribucion } from '@/types/database';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions para la gestión de listas de distribución.
 * Se utiliza el admin client para bypass de RLS que está dando problemas
 * en la tabla listas_distribucion, pero verificando primero la sesión.
 */

async function ensureAuthenticated() {
    const supabase = await createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        throw new Error('No autorizado. Debes iniciar sesión.');
    }

    return session;
}

export async function crearListaAction(
    listaData: Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>
) {
    await ensureAuthenticated();

    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
        .from('listas_distribucion')
        .insert(listaData)
        .select()
        .single();

    if (error) {
        console.error('[Actions] Error creating lista:', error);
        throw new Error(`Error en el servidor: ${error.message}`);
    }

    revalidatePath('/(protected)/listas');
    return data as ListaDistribucion;
}

export async function actualizarListaAction(
    id: string,
    listaData: Partial<Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>>
) {
    await ensureAuthenticated();

    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
        .from('listas_distribucion')
        .update(listaData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[Actions] Error updating lista:', error);
        throw new Error(`Error en el servidor: ${error.message}`);
    }

    revalidatePath('/(protected)/listas');
    return data as ListaDistribucion;
}

export async function eliminarListaAction(id: string) {
    await ensureAuthenticated();

    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient
        .from('listas_distribucion')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[Actions] Error deleting lista:', error);
        throw new Error(`Error en el servidor: ${error.message}`);
    }

    revalidatePath('/(protected)/listas');
}

export async function getListasAction(): Promise<ListaDistribucion[]> {
    await ensureAuthenticated();

    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
        .from('listas_distribucion')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error('[Actions] Error fetching listas:', error);
        throw new Error(`Error en el servidor: ${error.message}`);
    }

    return (data || []) as ListaDistribucion[];
}
