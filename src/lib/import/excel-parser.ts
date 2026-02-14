/**
 * Parser de Excel — Lista de Espera Quirúrgica
 * 
 * Lee un buffer .xlsx y retorna filas tipadas listas para BD.
 * 
 * Responsabilidad: SOLO transformación de datos.
 * No cifra, no escribe en BD, no sabe de UI.
 */

import * as XLSX from 'xlsx';
import { ExcelRow, EXCEL_COLUMN_MAP, DATE_FIELDS } from './types';

// --------------------------------------------------------------------------
// Constantes
// --------------------------------------------------------------------------

/** Epoch de Excel (30/12/1899) ajustada a JS Date */
const EXCEL_EPOCH = new Date(1899, 11, 30);

// --------------------------------------------------------------------------
// Funciones públicas
// --------------------------------------------------------------------------

/**
 * Parsea un buffer de archivo .xlsx y retorna las filas mapeadas.
 * 
 * @param buffer - ArrayBuffer del archivo Excel
 * @returns Array de ExcelRow con campos normalizados
 * @throws Error si el Excel no tiene las columnas esperadas
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Leer como array de arrays (primera fila = headers)
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
    });

    if (rawData.length < 2) {
        throw new Error('El archivo Excel está vacío o no tiene datos.');
    }

    const headers = rawData[0] as string[];
    validateHeaders(headers);

    const rows: ExcelRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rawData.length; i++) {
        const rawRow = rawData[i] as unknown[];

        // Saltar filas completamente vacías
        if (!rawRow || rawRow.every(cell => cell === '' || cell === null || cell === undefined)) {
            continue;
        }

        try {
            const row = mapRowToExcelRow(headers, rawRow);
            if (row.rdq) {
                rows.push(row);
            }
        } catch (err) {
            errors.push(`Fila ${i + 1}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
    }

    if (errors.length > 0) {
        console.warn(`[Excel Parser] ${errors.length} filas con errores:`, errors.slice(0, 5));
    }

    return rows;
}

// --------------------------------------------------------------------------
// Funciones privadas
// --------------------------------------------------------------------------

/**
 * Valida que el Excel tenga al menos la columna RDQ.
 */
function validateHeaders(headers: string[]): void {
    const hasRdq = headers.some(h => h?.trim() === 'RDQ');
    if (!hasRdq) {
        throw new Error(
            'El archivo Excel no contiene la columna "RDQ". ' +
            'Verifica que estás utilizando el formato correcto de lista de espera.'
        );
    }
}

/**
 * Mapea una fila raw a un ExcelRow tipado.
 */
function mapRowToExcelRow(headers: string[], rawRow: unknown[]): ExcelRow {
    const row: Record<string, unknown> = {};

    for (let col = 0; col < headers.length; col++) {
        const excelHeader = headers[col]?.trim();
        if (!excelHeader) continue;

        const dbField = EXCEL_COLUMN_MAP[excelHeader];
        if (!dbField) continue; // Columna no mapeada, la ignoramos

        let value = rawRow[col];

        // Convertir fechas de serial Excel a string ISO, o null si vacío
        if (DATE_FIELDS.includes(dbField)) {
            value = (typeof value === 'number' && value > 0)
                ? excelSerialToDateString(value)
                : null;
        } else if (dbField === 'rdq') {
            value = Number(value) || 0;
        } else if (dbField === 't_registro' || dbField === 't_garantia' || dbField === 't_total') {
            value = Number(value) || 0;
        } else {
            value = String(value ?? '').trim();
        }

        row[dbField] = value;
    }

    return row as unknown as ExcelRow;
}

/**
 * Convierte un número de serial de Excel a string de fecha YYYY-MM-DD.
 * 
 * Excel almacena las fechas como días desde 30/12/1899.
 * Incluye el ajuste por el bug de Lotus 1-2-3 (29/02/1900).
 */
function excelSerialToDateString(serial: number): string {
    // Ajuste: números con decimales son datetime, tomar solo la parte entera
    const days = Math.floor(serial);

    const date = new Date(EXCEL_EPOCH);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
