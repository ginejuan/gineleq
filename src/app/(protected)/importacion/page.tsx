import styles from '../page.module.css';

/**
 * Importación - Sincronización Excel (arquitectura.md §4)
 * Stub: Upload de Excel con lógica upsert se implementará en fases posteriores.
 */
export default function ImportacionPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Importación</h1>
                <p className={styles.pageSubtitle}>Sincronización de datos desde archivo Excel</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>📥</span>
                Carga de Excel con identificación por RDQ, upsert de datos y gestión de bajas automáticas.
            </div>
        </>
    );
}
