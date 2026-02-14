/**
 * Server Action — Importación de Excel
 * 
 * Recibe el archivo .xlsx, lo parsea, cifra PII,
 * hace upsert por RDQ y pasiviza registros ausentes.
 * 
 * Campos "estado", "priorizable" y "comentarios" NUNCA
 * se sobreescriben durante la importación.
 * 
 * Principio: La lógica es "ciega" (no sabe cómo se muestra).
 */

'use server';

import { parseExcelBuffer } from '@/lib/import/excel-parser';
import { encrypt, blindIndex } from '@/lib/encryption';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ExcelRow, ImportResult, EncryptedRow } from '@/lib/import/types';
import { PII_FIELDS, BLIND_INDEX_FIELDS } from '@/lib/import/types';

// --------------------------------------------------------------------------
// Constantes
// --------------------------------------------------------------------------

const TABLE_NAME = 'lista_espera';
const BATCH_SIZE = 50;

// Campos manuales que NO se sobreescriben en el upsert
const MANUAL_FIELDS = ['estado', 'priorizable', 'comentarios'];

// --------------------------------------------------------------------------
// Acción principal
// --------------------------------------------------------------------------

export async function importExcelAction(formData: FormData): Promise<ImportResult> {
    const startTime = Date.now();
    const result: ImportResult = {
        success: false,
        totalRows: 0,
        inserted: 0,
        updated: 0,
        passivated: 0,
        errors: [],
        duration: 0,
    };

    try {
        // 1. Extraer el archivo del formulario
        const file = formData.get('excelFile') as File;
        if (!file || file.size === 0) {
            result.errors.push('No se ha proporcionado ningún archivo.');
            return finalizeResult(result, startTime);
        }

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            result.errors.push('El archivo debe ser un Excel (.xlsx o .xls).');
            return finalizeResult(result, startTime);
        }

        // 2. Parsear el Excel
        const buffer = await file.arrayBuffer();
        const rows = parseExcelBuffer(buffer);
        result.totalRows = rows.length;

        if (rows.length === 0) {
            result.errors.push('El archivo Excel no contiene datos válidos.');
            return finalizeResult(result, startTime);
        }

        // 3. Obtener RDQs existentes (para distinguir insert vs update)
        const supabase = createSupabaseAdminClient();
        const { data: existingRows } = await supabase
            .from(TABLE_NAME)
            .select('rdq')
            .eq('estado', 'Activo');

        const existingRdqs = new Set(
            (existingRows ?? []).map((r: { rdq: number }) => r.rdq)
        );

        // 4. Cifrar y preparar los registros
        const encryptedRows = rows.map(row => encryptRow(row));
        const importedRdqs = new Set(encryptedRows.map(r => r.rdq));

        // 5. Upsert por lotes
        for (let i = 0; i < encryptedRows.length; i += BATCH_SIZE) {
            const batch = encryptedRows.slice(i, i + BATCH_SIZE);

            // Construir datos de upsert SIN los campos manuales
            const upsertData = batch.map(row => {
                const data: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(row)) {
                    if (!MANUAL_FIELDS.includes(key)) {
                        data[key] = value;
                    }
                }
                data.updated_at = new Date().toISOString();
                return data;
            });

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(upsertData, { onConflict: 'rdq', ignoreDuplicates: false });

            if (error) {
                result.errors.push(
                    `Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
                );
            } else {
                for (const row of batch) {
                    if (existingRdqs.has(row.rdq)) {
                        result.updated++;
                    } else {
                        result.inserted++;
                    }
                }
            }
        }

        // 6. Pasivizar RDQs activos que no aparecen en el Excel
        const rdqsToPassivate = [...existingRdqs].filter(rdq => !importedRdqs.has(rdq));

        if (rdqsToPassivate.length > 0) {
            const { error: passiveError } = await supabase
                .from(TABLE_NAME)
                .update({ estado: 'Pasivo', updated_at: new Date().toISOString() })
                .in('rdq', rdqsToPassivate);

            if (passiveError) {
                result.errors.push(`Error pasivizando registros: ${passiveError.message}`);
            } else {
                result.passivated = rdqsToPassivate.length;
            }
        }

        result.success = result.errors.length === 0;
    } catch (err) {
        result.errors.push(
            `Error inesperado: ${err instanceof Error ? err.message : 'Desconocido'}`
        );
    }

    return finalizeResult(result, startTime);
}

// --------------------------------------------------------------------------
// Funciones internas
// --------------------------------------------------------------------------

/**
 * Cifra los campos PII de una fila y genera blind indices.
 */
function encryptRow(row: ExcelRow): EncryptedRow {
    const encrypted: Record<string, unknown> = { ...row };

    // Cifrar campos PII
    for (const field of PII_FIELDS) {
        const value = String(row[field] ?? '');
        encrypted[field] = encrypt(value);
    }

    // Generar blind indices para búsquedas
    for (const field of BLIND_INDEX_FIELDS) {
        const value = String(row[field] ?? '');
        encrypted[`${field}_blind_index`] = blindIndex(value);
    }

    // Valores por defecto para campos manuales (solo en inserts,
    // el upsert los ignora gracias a la exclusión en MANUAL_FIELDS)
    encrypted.estado = 'Activo';
    encrypted.priorizable = false;
    encrypted.comentarios = '';

    return encrypted as unknown as EncryptedRow;
}

/**
 * Calcula la duración y retorna el resultado final.
 */
function finalizeResult(result: ImportResult, startTime: number): ImportResult {
    result.duration = Date.now() - startTime;
    return result;
}
