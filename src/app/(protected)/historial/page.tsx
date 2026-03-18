import styles from '../page.module.css';
import { historialService } from '@/services/historialService';
import HistorialClient from '@/components/Historial/HistorialClient';

export const dynamic = 'force-dynamic'; // Asegura que la tabla se actualice sin caché

/**
 * Historial de Partes Quirúrgicos
 */
export default async function HistorialPage() {
    const quirofanos = await historialService.getHistorialQuirofanos();

    return (
        <>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Historial</h1>
                <p className={styles.pageSubtitle}>Registro histórico de intervenciones quirúrgicas y sesiones pasadas</p>
            </header>
            <main style={{ marginTop: '20px' }}>
                <HistorialClient quirofanos={quirofanos} />
            </main>
        </>
    );
}
