'use client';

/**
 * Sidebar - Componente de navegación principal
 *
 * Recibe el rol del usuario (del Server Component padre) y muestra
 * solo los items de navegación autorizados para ese perfil.
 *
 * Responsabilidad: SOLO navegación y presentación visual.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';
import styles from './Sidebar.module.css';
import type { AppRole } from '@/lib/auth/roles';
import { isAdmin, canEdit } from '@/lib/auth/roles';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const NAV_ITEMS_PRINCIPAL: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/lista-espera', label: 'Lista de Espera', icon: '📋' },
    { href: '/alertas', label: 'Alertas', icon: '🔔' },
];

const NAV_ITEMS_GESTION_ALL: NavItem[] = [
    { href: '/agenda', label: 'Agenda Quirófanos', icon: '🗓️' },
    { href: '/programacion', label: 'Ayuda Programación', icon: '🎯' },
    { href: '/listas', label: 'Listas Correo', icon: '📬' },
    { href: '/historial', label: 'Historial', icon: '📜' },
];

const NAV_ITEMS_ADMIN_ONLY: NavItem[] = [
    { href: '/cirujanos', label: 'Facultativos', icon: '👨‍⚕️' },
    { href: '/importacion', label: 'Importación', icon: '📥' },
];

const NAV_ITEMS_ADMIN_SECTION: NavItem[] = [
    { href: '/admin/usuarios', label: 'Gestión Usuarios', icon: '👥' },
];

interface SidebarProps {
    rol: AppRole;
}

export default function Sidebar({ rol }: SidebarProps) {
    const pathname = usePathname();

    function isActive(href: string): boolean {
        return pathname === href || pathname.startsWith(href + '/');
    }

    function renderNavItem(item: NavItem) {
        const linkClasses = [
            styles.navLink,
            isActive(item.href) ? styles.navLinkActive : '',
        ].filter(Boolean).join(' ');

        return (
            <Link key={item.href} href={item.href} className={linkClasses}>
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
            </Link>
        );
    }

    // Items de Gestión visibles según rol
    const gestionItems = canEdit(rol)
        ? NAV_ITEMS_GESTION_ALL
        : NAV_ITEMS_GESTION_ALL.filter(i => ['/agenda', '/programacion', '/historial'].includes(i.href));

    return (
        <aside className={styles.sidebar}>
            {/* Cabecera */}
            <div className={styles.sidebarHeader}>
                <Link href="/dashboard" className={styles.logo}>
                    <span className={styles.logoIcon}>🏥</span>
                    <div>
                        <span className={styles.logoText}>GineLeq</span>
                        <span className={styles.logoSubtitle}>Lista Espera Quirúrgica</span>
                    </div>
                </Link>
            </div>

            {/* Navegación */}
            <nav className={styles.nav}>
                <span className={styles.navLabel}>Principal</span>
                {NAV_ITEMS_PRINCIPAL.map(renderNavItem)}

                <span className={styles.navLabel}>Gestión</span>
                {gestionItems.map(renderNavItem)}

                {/* Items exclusivos de administrador */}
                {isAdmin(rol) && NAV_ITEMS_ADMIN_ONLY.map(renderNavItem)}

                {/* Sección Administración */}
                {isAdmin(rol) && (
                    <>
                        <span className={styles.navLabel}>Administración</span>
                        {NAV_ITEMS_ADMIN_SECTION.map(renderNavItem)}
                    </>
                )}
            </nav>

            {/* Footer con logout */}
            <div className={styles.sidebarFooter}>
                <form action={logoutAction}>
                    <button type="submit" className={styles.logoutButton}>
                        <span className={styles.navIcon}>🚪</span>
                        Cerrar Sesión
                    </button>
                </form>
                <span className={styles.version}>GineLeq v0.1.0</span>
            </div>
        </aside>
    );
}

