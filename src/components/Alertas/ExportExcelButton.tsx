'use client';

import { useState } from 'react';
import * as xlsx from 'xlsx';
import { exportAlertasExcelAccion } from '@/app/(protected)/alertas/actions';
import { WaitlistFilters } from '@/lib/waitlist/waitlist-data';

export function ExportExcelButton({ filters }: { filters: WaitlistFilters }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await exportAlertasExcelAccion(filters);
            
            // Format data for excel
            const rows = data.map(item => ({
                'RDQ': item.rdq,
                'Paciente': item.paciente,
                'NHC': item.nhc,
                'Diagnóstico': item.diagnostico,
                'Procedimiento': item.procedimiento,
                'Fecha Preanestesia': item.f_preanestesia ? new Date(item.f_preanestesia).toLocaleDateString('es-ES') : 'N/A',
                'Estado Preanestesia': item.rdo_preanestesia || 'Pte',
                'Días Espera': item.t_registro,
                'Tiempo Límite Garantía': item.procedimiento_garantia?.toUpperCase() === 'SI' ? '180 Días' : '365 Días',
                'Priorizable': item.priorizable ? 'Sí' : 'No',
                'Prioridad': item.prioridad,
                'Facultativo': item.facultativo,
            }));

            // Create workbook
            const worksheet = xlsx.utils.json_to_sheet(rows);
            // Auto size columns roughly
            worksheet['!cols'] = [
                { wch: 10 }, // RDQ
                { wch: 30 }, // Paciente
                { wch: 15 }, // NHC
                { wch: 40 }, // Diagnostico
                { wch: 40 }, // Procedimiento
                { wch: 18 }, // Fecha Preanestesia
                { wch: 18 }, // Estado Preanestesia
                { wch: 12 }, // Dias Espera
                { wch: 22 }, // Tiempo Limite
                { wch: 10 }, // Priorizable
                { wch: 15 }, // Prioridad
                { wch: 20 }, // Facultativo
            ];

            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Alertas');
            
            // Generate and download
            xlsx.writeFile(workbook, `Alertas_Ginecologia_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error(error);
            alert('Hubo un error al generar el documento de Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button 
            disabled={isExporting} 
            onClick={handleExport} 
            style={{ 
                padding: '0.6rem 1.2rem', 
                backgroundColor: '#10B981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: isExporting ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: 600,
                opacity: isExporting ? 0.7 : 1,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
                if (!isExporting) e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseOut={(e) => {
                if (!isExporting) e.currentTarget.style.backgroundColor = '#10B981';
            }}
        >
            {isExporting ? '⏳ Procesando...' : '📥 Exportar Listado (Excel)'}
        </button>
    );
}
