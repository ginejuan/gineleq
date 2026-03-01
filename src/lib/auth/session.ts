/**
 * session.ts — Server-side helper para leer rol del usuario actual
 *
 * Se usa en Server Components y layout para pasar el rol al Sidebar.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppRole } from './roles';

export async function getCurrentUserRole(): Promise<AppRole> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 'consulta';

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();

    return (profile?.rol as AppRole) ?? 'consulta';
}
