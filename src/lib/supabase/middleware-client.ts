/**
 * Supabase Middleware Client
 * 
 * Cliente específico para el middleware de Next.js.
 * Refresca la sesión en cada petición y sincroniza cookies.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    for (const { name, value } of cookiesToSet) {
                        request.cookies.set(name, value);
                    }
                    supabaseResponse = NextResponse.next({ request });
                    for (const { name, value, options } of cookiesToSet) {
                        supabaseResponse.cookies.set(name, value, options);
                    }
                },
            },
        }
    );

    // Refrescar la sesión (necesario para mantener tokens válidos)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { user, supabaseResponse };
}
