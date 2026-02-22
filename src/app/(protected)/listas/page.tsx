'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ListaDistribucion } from '@/types/database';
import { listasService } from '@/services/listasService';
import { ListasTable } from '@/components/Listas/ListasTable';
import { ListasModal } from '@/components/Listas/ListasModal';
import styles from '@/components/Listas/Listas.module.css';

export default function ListasPage() {
    const [listas, setListas] = useState<ListaDistribucion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listaToEdit, setListaToEdit] = useState<ListaDistribucion | undefined>(undefined);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await listasService.getListas();
            setListas(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar las listas de distribución.');
            console.error('Error fetching listas:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClick = () => {
        setListaToEdit(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (lista: ListaDistribucion) => {
        setListaToEdit(lista);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la lista "${nombre}"?`)) {
            return;
        }

        try {
            await listasService.eliminarLista(id);
            setListas(listas.filter(l => l.id !== id));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error al eliminar la lista de distribución.');
        }
    };

    const handleSaveLista = async (listaData: Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>) => {
        if (listaToEdit) {
            const updated = await listasService.actualizarLista(listaToEdit.id, listaData);
            setListas(listas.map(l => l.id === updated.id ? updated : l));
        } else {
            const created = await listasService.crearLista(listaData);
            setListas([...listas, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div className={styles.pageHeader}>
                <div className={styles.titleWrapper}>
                    <h1>Listas de Distribución</h1>
                    <p className={styles.subtitle}>
                        Configura grupos de correos electrónicos para enviar el Parte de Quirófano.
                    </p>
                </div>
                <button className={styles.btnPrimary} onClick={handleCreateClick}>
                    <span style={{ fontSize: '1.2em', lineHeight: 1 }}>+</span> Nueva Lista
                </button>
            </div>

            {error && (
                <div style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <ListasTable
                listas={listas}
                isLoading={isLoading}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />

            <ListasModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveLista}
                listaToEdit={listaToEdit}
            />
        </div>
    );
}
