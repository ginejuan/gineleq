'use client';

/**
 * Sidebar - Componente de navegación principal
 * 
 * Menú lateral con los 7 módulos definidos en arquitectura.md §5.
 * Usa usePathname() para resaltar la ruta activa.
 * Incluye botón de cerrar sesión.
 * 
 * Responsabilidad: SOLO navegación y presentación visual.
 * No contiene lógica de negocio.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';
import styles from './Sidebar.module.css';

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

const NAV_ITEMS_GESTION: NavItem[] = [
    { href: '/agenda', label: 'Agenda Quirófanos', icon: '🗓️' },
    { href: '/cirujanos', label: 'Facultativos', icon: '👨‍⚕️' },
    { href: '/programacion', label: 'Ayuda Programación', icon: '🎯' },
    { href: '/importacion', label: 'Importación', icon: '📥' },
    { href: '/historial', label: 'Historial', icon: '📜' },
];

export default function Sidebar() {
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
                {NAV_ITEMS_GESTION.map(renderNavItem)}
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
