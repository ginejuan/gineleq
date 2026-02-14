import styles from '../page.module.css';

/**
 * Historial (arquitectura.md §5)
 * Stub: Registro histórico de cambios e intervenciones se implementará en fases posteriores.
 */
export default function HistorialPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Historial</h1>
                <p className={styles.pageSubtitle}>Registro histórico de intervenciones y cambios</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>📜</span>
                Historial de importaciones, cambios de estado y operaciones realizadas.
            </div>
        </>
    );
}
