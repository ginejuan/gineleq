import styles from '../page.module.css';
import ProgramacionBoard from '@/components/Programacion/ProgramacionBoard';
import { getCurrentUserRole } from '@/lib/auth/session';

/**
 * Ayuda a la Programación - Selección Inteligente con Drag & Drop
 */
export default async function ProgramacionPage() {
    const rol = await getCurrentUserRole();
    const readOnly = rol === 'consulta';

    return (
        <div className={styles.boardContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Programación de Quirófanos</h1>
                <p className={styles.pageSubtitle}>
                    {readOnly
                        ? 'Vista de solo lectura — no puede modificar la programación'
                        : 'Arrastra pacientes desde las sugerencias hasta el quirófano deseado'}
                </p>
            </header>

            <ProgramacionBoard readOnly={readOnly} />
        </div>
    );
}
