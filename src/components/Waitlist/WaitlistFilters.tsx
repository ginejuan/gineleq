'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Waitlist.module.css';

export function WaitlistFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    function updateFilter(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1'); // Reset pagination
        router.push(`?${params.toString()}`);
    }

    const filters = [
        { key: 'onco', label: 'Solo Oncológicas' },
        { key: 'garantia', label: 'Solo Garantía' },
        { key: 'priorizable', label: 'Priorizables' },
        { key: 'anestesia', label: 'Requieren Anestesia (General/Regional)' },
        { key: 'local', label: 'Local / Sin Anestesia' },
    ];

    const currentEstado = searchParams.get('estado') || 'Activo';

    return (
        <aside className={styles.filters}>
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Estado</h3>
                <label className={styles.filterOption}>
                    <input
                        type="radio"
                        name="estado"
                        value="Activo"
                        checked={currentEstado === 'Activo'}
                        onChange={() => updateFilter('estado', 'Activo')}
                        className={styles.checkbox}
                    />
                    Activo
                </label>
                <label className={styles.filterOption}>
                    <input
                        type="radio"
                        name="estado"
                        value="Suspendido"
                        checked={currentEstado === 'Suspendido'}
                        onChange={() => updateFilter('estado', 'Suspendido')}
                        className={styles.checkbox}
                    />
                    Suspendido
                </label>
                <label className={styles.filterOption}>
                    <input
                        type="radio"
                        name="estado"
                        value="Todos"
                        checked={currentEstado === 'Todos'}
                        onChange={() => updateFilter('estado', 'Todos')}
                        className={styles.checkbox}
                    />
                    Todos
                </label>
            </div>

            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Filtros Clínicos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className={styles.filterOption}>
                        <input
                            type="radio"
                            name="clinical_filter" // Group name ensures single selection natively, but we control state
                            value="all"
                            checked={!searchParams.get('clinical_filter') || searchParams.get('clinical_filter') === 'all'}
                            onChange={() => updateFilter('clinical_filter', 'all')}
                            className={styles.checkbox}
                        />
                        Todos
                    </label>

                    {filters.map(f => (
                        <label key={f.key} className={styles.filterOption}>
                            <input
                                type="radio"
                                name="clinical_filter"
                                value={f.key}
                                checked={searchParams.get('clinical_filter') === f.key}
                                onChange={() => updateFilter('clinical_filter', f.key)}
                                className={styles.checkbox}
                            />
                            {f.label}
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}
