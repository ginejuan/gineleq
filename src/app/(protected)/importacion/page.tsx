'use client';

/**
 * Página de Importación — Sincronización Excel → BD
 * 
 * UI con zona de drag & drop para subir el Excel de lista
 * de espera y mostrar resultados de la importación.
 * 
 * Responsabilidad: SOLO presentación visual.
 * La lógica de importación está en ./actions.ts.
 */

import { useState, useRef, useCallback } from 'react';
import { importExcelAction } from './actions';
import type { ImportResult } from '@/lib/import/types';
import pageStyles from '../page.module.css';
import styles from './importacion.module.css';

type ImportState = 'idle' | 'loading' | 'done';

export default function ImportacionPage() {
    const [state, setState] = useState<ImportState>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ---- Handlers de archivos ----

    const handleFileSelect = useCallback((selectedFile: File) => {
        if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
            setFile(selectedFile);
            setResult(null);
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFileSelect(selectedFile);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    }, [handleFileSelect]);

    // ---- Handler de importación ----

    const handleImport = useCallback(async () => {
        if (!file) return;

        setState('loading');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('excelFile', file);
            const importResult = await importExcelAction(formData);
            setResult(importResult);
        } catch {
            setResult({
                success: false,
                totalRows: 0,
                inserted: 0,
                updated: 0,
                passivated: 0,
                errors: ['Error inesperado al procesar la importación.'],
                duration: 0,
            });
        } finally {
            setState('done');
        }
    }, [file]);

    // ---- Render ----

    return (
        <>
            <header className={pageStyles.pageHeader}>
                <h1 className={pageStyles.pageTitle}>Importación</h1>
                <p className={pageStyles.pageSubtitle}>
                    Sincronización de datos desde archivo Excel
                </p>
            </header>

            {/* Zona de Drop */}
            <div
                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
            >
                <span className={styles.dropIcon}>📥</span>
                <p className={styles.dropLabel}>
                    Arrastra tu fichero Excel aquí
                </p>
                <p className={styles.dropHint}>
                    o haz clic para seleccionar (.xlsx)
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleInputChange}
                    className={styles.fileInput}
                />
                {file && (
                    <div className={styles.selectedFile}>
                        📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </div>
                )}
            </div>

            {/* Botón de importación */}
            <button
                onClick={handleImport}
                disabled={!file || state === 'loading'}
                className={styles.importButton}
            >
                {state === 'loading' ? 'Importando...' : 'Importar Datos'}
            </button>

            {/* Barra de progreso */}
            {state === 'loading' && (
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '80%' }} />
                </div>
            )}

            {/* Resultados */}
            {result && <ImportResults result={result} />}
        </>
    );
}

// --------------------------------------------------------------------------
// Componente de Resultados
// --------------------------------------------------------------------------

function ImportResults({ result }: { result: ImportResult }) {
    return (
        <>
            {/* Resumen general */}
            <div className={`${styles.resultSummary} ${result.success ? styles.resultSummarySuccess : styles.resultSummaryError
                }`}>
                <p className={styles.summaryTitle}>
                    {result.success
                        ? '✅ Importación completada correctamente'
                        : '⚠️ Importación completada con errores'}
                </p>
                <p className={styles.summaryDetail}>
                    {result.totalRows} registros procesados en {(result.duration / 1000).toFixed(1)}s
                </p>
            </div>

            {/* Tarjetas de métricas */}
            <div className={styles.resultGrid}>
                <div className={styles.resultCard}>
                    <span className={`${styles.resultNumber} ${styles.resultInserted}`}>
                        {result.inserted}
                    </span>
                    <span className={styles.resultLabel}>Nuevos</span>
                </div>
                <div className={styles.resultCard}>
                    <span className={`${styles.resultNumber} ${styles.resultUpdated}`}>
                        {result.updated}
                    </span>
                    <span className={styles.resultLabel}>Actualizados</span>
                </div>
                <div className={styles.resultCard}>
                    <span className={`${styles.resultNumber} ${styles.resultPassivated}`}>
                        {result.passivated}
                    </span>
                    <span className={styles.resultLabel}>Pasivizados</span>
                </div>
                {result.errors.length > 0 && (
                    <div className={styles.resultCard}>
                        <span className={`${styles.resultNumber} ${styles.resultErrors}`}>
                            {result.errors.length}
                        </span>
                        <span className={styles.resultLabel}>Errores</span>
                    </div>
                )}
            </div>

            {/* Lista de errores */}
            {result.errors.length > 0 && (
                <ul className={styles.errorList}>
                    {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                    ))}
                </ul>
            )}
        </>
    );
}
