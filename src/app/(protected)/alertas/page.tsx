import { getWaitlistData, type WaitlistRow } from '@/lib/waitlist/waitlist-data';
import { WaitlistTable } from '@/components/Waitlist/WaitlistTable';
import { AlertasFilters } from '@/components/Alertas/AlertasFilters';
import waitlistStyles from '@/components/Waitlist/Waitlist.module.css';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Alertas - Monitorización de plazos (arquitectura.md §6)
 * Se reutilizan los componentes de tabla de la lista de espera (WaitlistTable)
 * para presentar la información filtrada por los criterios de alerta.
 */
export default async function AlertasPage({ searchParams }: PageProps) {
    const params = await searchParams;

    const page = Number(params.page) || 1;
    const pageSize = 50;
    const sortBy = (params.sortBy as keyof WaitlistRow) || 't_registro';
    const sortDir = (params.sortDir as 'asc' | 'desc') || 'desc';
    const search = (params.search as string) || '';

    // Alert filters - specifically checking preanestesia_caducada
    const alert_filter = (params.alert_filter as string) || 'preanestesia_caducada';

    const filters = {
        search,
        alert_filter
    };

    const data = await getWaitlistData({
        page,
        pageSize,
        sortBy,
        sortDir,
        filters,
    });

    return (
        <div className={waitlistStyles.pageContainer}>
            <AlertasFilters />

            <div className={waitlistStyles.content}>
                <header className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Alertas</h1>
                    <p className={styles.pageSubtitle}>Monitorización de plazos estipulados y caducidades</p>
                </header>

                <WaitlistTable data={data} />
            </div>
        </div>
    );
}
