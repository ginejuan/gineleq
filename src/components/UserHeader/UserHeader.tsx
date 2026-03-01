/**
 * UserHeader — Barra superior con info del usuario
 *
 * Server Component: lee la sesión y pasa los datos al
 * UserMenu (Client Component) que gestiona el dropdown.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './UserHeader.module.css';
import UserMenu from './UserMenu';

interface UserMetadata {
    first_name?: string;
    last_name?: string;
}

export default async function UserHeader() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const metadata = user.user_metadata as UserMetadata;
    const firstName = metadata?.first_name ?? '';
    const lastName = metadata?.last_name ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email || '';
    const initials = getInitials(firstName, lastName, user.email);

    return (
        <header className={styles.userHeader}>
            <UserMenu displayName={displayName} email={user.email ?? ''} initials={initials} />
        </header>
    );
}

/** Genera iniciales a partir del nombre, o del email si no hay nombre */
function getInitials(
    firstName: string,
    lastName: string,
    email: string | undefined
): string {
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
        return firstName[0].toUpperCase();
    }
    return email?.[0]?.toUpperCase() ?? '?';
}

