import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Force usage of the configured public URL as origin
    // This is critical when running behind a proxy (Dokploy/Traefik) 
    // to prevent localhost redirects or protocol mismatches (http vs https)
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://leqgine.es';

    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createSupabaseServerClient();
        console.log('Intercambiando código por sesión...', { code });
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            console.log('Sesión establecida correctamente. Redirigiendo a:', next);
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error('Error intercambiando código:', error);
            // Redirect to error page with details
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.name}&error_description=${error.message}`);
        }
    } else {
        console.error('No se recibió ningún código en el callback.');
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=NoCode&error_description=No+se+recibio+codigo+de+autenticacion`);
}
