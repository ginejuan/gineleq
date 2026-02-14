/**
 * Server Actions para Autenticación
 * 
 * Todas las operaciones de auth se ejecutan en el servidor.
 * Principio: La lógica de negocio es "ciega" (no sabe cómo se muestra).
 */

'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// --------------------------------------------------------------------------
// Tipos de respuesta
// --------------------------------------------------------------------------

interface AuthResult {
    error: string | null;
    success?: boolean;
}

// --------------------------------------------------------------------------
// Login
// --------------------------------------------------------------------------

export async function loginAction(formData: FormData): Promise<AuthResult> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email y contraseña son obligatorios.' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }

    redirect('/dashboard');
}

// --------------------------------------------------------------------------
// Registro
// --------------------------------------------------------------------------

export async function registerAction(formData: FormData): Promise<AuthResult> {
    const firstName = (formData.get('firstName') as string)?.trim();
    const lastName = (formData.get('lastName') as string)?.trim();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return { error: 'Todos los campos son obligatorios.' };
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' };
    }

    if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // Usamos el admin client para crear usuarios auto-confirmados
    // (evita el requerimiento de SMTP en Supabase self-hosted)
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
        },
    });

    if (error) {
        // Mensaje amigable para errores comunes
        if (error.message.includes('already been registered')) {
            return { error: 'Ya existe una cuenta con ese email.' };
        }
        return { error: `Error al registrar: ${error.message}` };
    }

    return { error: null, success: true };
}

// --------------------------------------------------------------------------
// Recuperar contraseña
// --------------------------------------------------------------------------

export async function resetPasswordAction(formData: FormData): Promise<AuthResult> {
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Introduce tu email.' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`,
    });

    if (error) {
        return { error: `Error al enviar el email: ${error.message}` };
    }

    return { error: null, success: true };
}

// --------------------------------------------------------------------------
// Cerrar sesión
// --------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect('/login');
}
