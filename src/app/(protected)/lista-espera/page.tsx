import { getWaitlistData, type WaitlistRow } from '@/lib/waitlist/waitlist-data';
import { WaitlistTable } from '@/components/Waitlist/WaitlistTable';
import { WaitlistFilters } from '@/components/Waitlist/WaitlistFilters';
import { SearchInput } from '@/components/Waitlist/SearchInput';
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
        priorizable: params.priorizable === 'true',
        garantia: params.garantia === 'true',
        onco: params.onco === 'true',
        anestesia: params.anestesia === 'true',
        estado: (params.estado as string) || 'Activo',
    };

    const data = await getWaitlistData({
        page,
        pageSize,
        sortBy,
        sortDir,
        filters,
    });

    return (
        <div className={styles.pageContainer}>
            <WaitlistFilters />

            <div className={styles.content}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Lista de Espera</h1>
                        <p className={styles.subtitle}>
                            Gestión y seguimiento de pacientes
                        </p>
                    </div>
                    <div style={{ width: '320px' }}>
                        <SearchInput />
                    </div>
                </header>

                <WaitlistTable data={data} />
            </div>
        </div>
    );
}
