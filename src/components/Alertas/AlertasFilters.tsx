'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../Waitlist/Waitlist.module.css';

export function AlertasFilters() {
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

    return (
        <aside className={styles.filters}>
            {/* 1. Filtro por Paciente */}
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Búsqueda Rápida</h3>
                <input
                    type="text"
                    placeholder="Buscar por Paciente, NHC o RDQ..."
                    defaultValue={searchParams.get('search') || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setTimeout(() => updateFilter('search', val || null), 500); // Simple debounce
                    }}
                    className={styles.searchInput} // Reusing styles from Waitlist
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                />
            </div>

            {/* 2. Tipo de Alerta */}
            <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Tipo de Alerta</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className={styles.filterOption}>
                        <input
                            type="radio"
                            name="alert_filter"
                            value="todos"
                            checked={!searchParams.get('alert_filter') || searchParams.get('alert_filter') === 'todos'}
                            onChange={() => updateFilter('alert_filter', 'todos')}
                            className={styles.checkbox}
                        />
                        Todas las Alertas
                    </label>

                    <label className={styles.filterOption}>
                        <input
                            type="radio"
                            name="alert_filter"
                            value="preanestesia_caducada"
                            checked={searchParams.get('alert_filter') === 'preanestesia_caducada'}
                            onChange={() => updateFilter('alert_filter', 'preanestesia_caducada')}
                            className={styles.checkbox}
                        />
                        <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 500 }}>
                            Preanestesia Caducada (&gt;180 días)
                        </span>
                    </label>
                </div>
            </div>
        </aside>
    );
}
