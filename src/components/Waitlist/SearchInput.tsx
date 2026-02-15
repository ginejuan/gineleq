'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import styles from './Waitlist.module.css';

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [text, setText] = useState(searchParams.get('search') || '');
    const query = useDebounce(text, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set('search', query);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    }, [query, router, searchParams]); // searchParams dependency might cause loops if not careful, but usually okay if params same.

    return (
        <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
                type="text"
                placeholder="Buscar por Paciente, NHC, Diagnóstico o RDQ..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={styles.searchInput}
            />
        </div>
    );
}
