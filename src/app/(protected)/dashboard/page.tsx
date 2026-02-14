import styles from '../page.module.css';

/**
 * Dashboard - Panel de Control (arquitectura.md §10)
 * Stub: KPIs y listados de seguimiento se implementarán en fases posteriores.
 */
export default function DashboardPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                <p className={styles.pageSubtitle}>Panel de control — Visión analítica de la unidad</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>📊</span>
                KPIs, gráficos de demora y listados de seguimiento crítico se implementarán aquí.
            </div>
        </>
    );
}
