import { getWaitlistData, getWaitlistFilterOptions, type WaitlistRow } from '@/lib/waitlist/waitlist-data';
import { WaitlistTable } from '@/components/Waitlist/WaitlistTable';
import { WaitlistFilters } from '@/components/Waitlist/WaitlistFilters';
import styles from '@/components/Waitlist/Waitlist.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListaEsperaPage({ searchParams }: PageProps) {
    const params = await searchParams;

    const page = Number(params.page) || 1;
    const pageSize = 50;
    const sortBy = (params.sortBy as keyof WaitlistRow) || 't_registro';
    const sortDir = (params.sortDir as 'asc' | 'desc') || 'desc';
    const search = (params.search as string) || '';

    const filters = {
        search,
        clinical_filter: (params.clinical_filter as string) || 'all',
        preanestesia: (params.preanestesia as string) || 'todos',
        diagnostico: (params.diagnostico as string) || 'todos',
        procedimiento: (params.procedimiento as string) || 'todos',
    };

    const [data, filterOptions] = await Promise.all([
        getWaitlistData({ page, pageSize, sortBy, sortDir, filters }),
        getWaitlistFilterOptions(),
    ]);

    return (
        <div className={styles.pageContainer}>
            <WaitlistFilters
                diagnosticos={filterOptions.diagnosticos}
                procedimientos={filterOptions.procedimientos}
            />

            <div className={styles.content}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Lista de Espera</h1>
                        <p className={styles.subtitle}>
                            Gestión y seguimiento de pacientes
                        </p>
                    </div>
                </header>

                <WaitlistTable data={data} />
            </div>
        </div>
    );
}
