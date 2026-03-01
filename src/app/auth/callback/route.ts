import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Force usage of the configured public URL as origin
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://leqgine.es';

    const code = searchParams.get('code');
    const type = searchParams.get('type'); // 'invite' cuando viene de una invitación
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createSupabaseServerClient();
        console.log('Intercambiando código por sesión...', { code, type });
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Si es una invitación, redirigir a configurar contraseña antes de entrar
            if (type === 'invite') {
                console.log('Flujo de invitación: redirigiendo a /reset-password');
                return NextResponse.redirect(`${origin}/reset-password?invited=1`);
            }
            console.log('Sesión establecida correctamente. Redirigiendo a:', next);
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error('Error intercambiando código:', error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.name}&error_description=${error.message}`);
        }
    } else {
        console.error('No se recibió ningún código en el callback.');
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=NoCode&error_description=No+se+recibio+codigo+de+autenticacion`);
}

