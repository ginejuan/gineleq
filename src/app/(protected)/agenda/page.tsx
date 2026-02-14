import styles from '../page.module.css';

/**
 * Agenda de Quirófanos (arquitectura.md §7)
 * Stub: Calendario mensual y registro de sesiones se implementarán en fases posteriores.
 */
export default function AgendaPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Agenda de Quirófanos</h1>
                <p className={styles.pageSubtitle}>Planificación y registro de sesiones quirúrgicas</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>🗓️</span>
                Calendario mensual con sesiones, tipo de quirófano y equipo médico asignado.
            </div>
        </>
    );
}
