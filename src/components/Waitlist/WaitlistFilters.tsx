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
        { key: 'onco', label: 'Solo Oncológicas', default: false },
        { key: 'garantia', label: 'Solo Garantía', default: false },
        { key: 'priorizable', label: 'Priorizables', default: false },
        { key: 'anestesia', label: 'Requieren Anestesia', default: false },
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
                {filters.map(f => {
                    const isActive = searchParams.get(f.key) === 'true';
                    return (
                        <label key={f.key} className={styles.filterOption}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => updateFilter(f.key, e.target.checked ? 'true' : null)}
                                className={styles.checkbox}
                            />
                            {f.label}
                        </label>
                    );
                })}
            </div>
        </aside>
    );
}
