/**
 * Supabase Server Client
 * 
 * Cliente para Server Components y Server Actions.
 * Usa cookies de Next.js para mantener la sesión.
 * 
 * Principio: Agnosticismo de dependencias — si se cambia
 * el proveedor de auth, solo se modifica este archivo.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-leqgine-auth-token',
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            cookieStore.set(name, value, options);
                        }
                    } catch {
                        // Silenciar en Server Components (read-only).
                        // Las cookies se setean correctamente en Server Actions y middleware.
                    }
                },
            },
        }
    );
}
