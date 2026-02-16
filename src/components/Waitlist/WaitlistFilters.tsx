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



    return (
        <aside className={styles.filters}>
            {/* 1. Filtro por Paciente (Previously SearchInput, now integrated) */}
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Filtro por Paciente</h3>
                <input
                    type="text"
                    placeholder="Buscar por Paciente, NHC o RDQ..."
                    defaultValue={searchParams.get('search') || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setTimeout(() => updateFilter('search', val || null), 500); // Simple debounce
                    }}
                    className={styles.searchInput} // Reusing styles if possible, or create standard input style
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                />
            </div>

            {/* 2. Visto Bueno Preanestesia (Replaces Estado) */}
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Visto Bueno Preanestesia</h3>
                <label className={styles.filterOption}>
                    <input
                        type="radio"
                        name="preanestesia"
                        value="apto"
                        checked={searchParams.get('preanestesia') === 'apto'}
                        onChange={() => updateFilter('preanestesia', 'apto')}
                        className={styles.checkbox}
                    />
                    Con Visto Bueno (Apto)
                </label>
                <label className={styles.filterOption}>
                    <input
                        type="radio"
                        name="preanestesia"
                        value="todos"
                        checked={!searchParams.get('preanestesia') || searchParams.get('preanestesia') === 'todos'}
                        onChange={() => updateFilter('preanestesia', 'todos')}
                        className={styles.checkbox}
                    />
                    Todas
                </label>
            </div>

            {/* 3. Filtros Clínicos */}
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Filtros Clínicos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className={styles.filterOption}>
                        <input
                            type="radio"
                            name="clinical_filter"
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
