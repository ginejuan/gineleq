import styles from '../page.module.css';

/**
 * Ayuda a la Programación - Selección Inteligente (arquitectura.md §8)
 * Stub: Ranking por urgencia, antigüedad y equipo se implementará en fases posteriores.
 */
export default function ProgramacionPage() {
    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Ayuda a la Programación</h1>
                <p className={styles.pageSubtitle}>Selección inteligente de pacientes para quirófano</p>
            </header>
            <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>🎯</span>
                Ranking basado en urgencia clínica, antigüedad y validación de equipo médico.
            </div>
        </>
    );
}
