import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        // 1. Usuario autenticado
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // 2. Rol devuelto por helper
        const rol = await getCurrentUserRole();

        // 3. Leer perfil directamente con admin client
        let profileDirect = null;
        let profileError = null;
        if (user) {
            const admin = createSupabaseAdminClient();
            const { data, error } = await admin
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            profileDirect = data;
            profileError = error?.message;
        }

        return NextResponse.json({
            user_id: user?.id ?? null,
            user_email: user?.email ?? null,
            user_error: userError?.message ?? null,
            rol_devuelto: rol,
            profile_directo: profileDirect,
            profile_error: profileError,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
