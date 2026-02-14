import styles from '../page.module.css';

/**
 * Lista de Espera (arquitectura.md §5)
 * Stub: Tabla con filtros y búsqueda se implementará en fases posteriores.
 */
export default function ListaEsperaPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Lista de Espera</h1>
                <p className={styles.pageSubtitle}>Registro completo de intervenciones quirúrgicas pendientes</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>📋</span>
                Tabla de pacientes con filtros, búsqueda por NHC y edición de campos manuales.
            </div>
        </>
    );
}
