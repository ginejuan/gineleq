import styles from '../page.module.css';

/**
 * Alertas - Monitorización de plazos (arquitectura.md §6)
 * Stub: Alertas oncológicas, garantía y estándar se implementarán en fases posteriores.
 */
export default function AlertasPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Alertas</h1>
                <p className={styles.pageSubtitle}>Monitorización de plazos legales y clínicos</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>🔔</span>
                Alertas oncológicas (30 días), de garantía (decreto) y estándar (365 días).
            </div>
        </>
    );
}
