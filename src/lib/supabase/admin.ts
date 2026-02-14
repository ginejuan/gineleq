/**
 * Supabase Admin Client
 * 
 * Cliente con permisos de administrador (service role key).
 * SOLO para operaciones del servidor que requieren privilegios elevados,
 * como crear usuarios con auto-confirmación (sin SMTP).
 * 
 * ⚠️ NUNCA exponer la service role key al cliente.
 */

import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            '[GineLeq] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
