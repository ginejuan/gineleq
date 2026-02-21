import styles from '../page.module.css';
import ProgramacionBoard from '@/components/Programacion/ProgramacionBoard';

/**
 * Ayuda a la Programación - Selección Inteligente con Drag & Drop
 */
export default function ProgramacionPage() {
    return (
        <div className={styles.boardContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Programación de Quirófanos</h1>
                <p className={styles.pageSubtitle}>Arrastra pacientes desde las sugerencias hasta el quirófano deseado</p>
            </header>

            <ProgramacionBoard />
        </div>
    );
}
