/**
 * session.ts — Server-side helper para leer rol del usuario actual
 *
 * Usa el admin client (service role) para bypassear RLS y garantizar
 * que siempre se lee el rol correcto sin interferencias de políticas.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppRole } from './roles';

export async function getCurrentUserRole(): Promise<AppRole> {
    // 1. Obtener el usuario autenticado desde las cookies de sesión
    const supabaseUser = await createSupabaseServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) return 'consulta';

    // 2. Leer el rol usando el admin client (bypasea RLS, siempre funciona en server)
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error('[getCurrentUserRole] Error leyendo perfil:', error?.message);
        return 'consulta';
    }

    return (profile.rol as AppRole);
}

