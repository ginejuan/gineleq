'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updatePatientManualFields(
    rdq: number,
    data: { priorizable: boolean; comentarios: string }
) {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
        .from('lista_espera')
        .update({
            priorizable: data.priorizable,
            comentarios: data.comentarios,
        })
        .eq('rdq', rdq);

    if (error) {
        throw new Error(`Error updating patient ${rdq}: ${error.message}`);
    }

    revalidatePath('/lista-espera');
    return { success: true };
}
