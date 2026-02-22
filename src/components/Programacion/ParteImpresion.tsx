'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './ParteImpresion.module.css';
import { SendEmailModal } from './SendEmailModal';

interface PrintPageProps {
    quirofano: any;
    pacientes: any[];
}

export default function ParteImpresion({ quirofano, pacientes }: PrintPageProps) {
    const documentRef = useRef<HTMLDivElement>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    // Auto trigger print dialog if requested (optional)
    useEffect(() => {
        // You could uncomment this if you want the print dialog to open immediately
        // window.print();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = () => {
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async (destinatarios: string[], subject: string, message: string) => {
        if (!documentRef.current) throw new Error("Documento no encontrado");

        // Clean subject for filename (remove invalid chars like colons for Windows)
        const safeFilename = subject.replace(/[:\\/*?"<>|]/g, '-');

        // Options for html2pdf
        const opt: any = {
            margin: [15, 15, 10, 10], // [top, left, bottom, right] en milímetros
            filename: `${safeFilename}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                windowWidth: 1200
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
            pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
        };

        // Cargar html2pdf dinámicamente solo en el cliente para evitar el error "self is not defined" en SSR
        const html2pdf = (await import('html2pdf.js')).default;

        // Generar Blob (archivo binario) en lugar de descargar
        const pdfBlob = await html2pdf()
            .set(opt)
            .from(documentRef.current)
            .output('blob');

        // Construir form-data para enviar al servidor
        const formData = new FormData();
        formData.append('pdf', pdfBlob, opt.filename);
        formData.append('to', destinatarios.join(','));
        formData.append('subject', subject);
        formData.append('text', message);

        // Llamar a nuestra API Route
        const res = await fetch('/api/email/enviar-parte', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error enviando correo.');
        }

        alert(`Correo enviado con éxito a ${destinatarios.length} destinatarios. 🎉`);
    };

    // Formatear Fecha
    const fechaObj = new Date(quirofano.fecha);
    const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaStr = fechaObj.toLocaleDateString('es-ES', opcionesFecha).toUpperCase();
    const fechaEmailStr = fechaObj.toLocaleDateString('es-ES', opcionesFecha);

    // Formatear Equipo
    const cirujanosStr = quirofano.quirofano_cirujano?.map((qc: any) => {
        const c = qc.cirujanos;
        const nombre = c.nombre;
        const apellido = c.apellido1;
        const tratamiento = c.tratamiento || 'Dr.'; // Default to Dr. as backup

        return `${tratamiento} ${nombre} ${apellido}`;
    }) || [];

    const cirujanosMailsForModal = quirofano.quirofano_cirujano?.map((qc: any) => ({
        nombre: `${qc.cirujanos.nombre} ${qc.cirujanos.apellido1}`,
        email: qc.cirujanos.e_mail || ''
    })).filter((c: any) => c.email !== '') || [];

    const tipoQuirofano = quirofano.tipo_quirofano?.toUpperCase() || 'QUIRÓFANO';
    const tipoQuirofanoLower = quirofano.tipo_quirofano?.toLowerCase() || 'quirófano';

    const defaultSubject = `Parte de quirófano de ginecología: ${tipoQuirofanoLower} del ${fechaEmailStr}`;
    const defaultMessage = `Estimados compañeros,\n\nAdjunto remito el parte de quirófano de ginecología correspondiente al ${tipoQuirofanoLower} del ${fechaEmailStr}.\n\nUn abrazo\nJuan Jesús`;

    return (
        <div className={styles.printWrapper}>
            {/* Botones Flotantes (No se imprimen por CSS) */}
            <div className={styles.floatingControls}>
                <button onClick={handleEmail} className={styles.exportButton} style={{ backgroundColor: '#10B981', marginBottom: '8px' }}>
                    ✉️ Enviar por Email
                </button>
                <button onClick={handlePrint} className={styles.exportButton}>
                    🖨️ Exportar / Imprimir
                </button>
                <div className={styles.helperText}>
                    💡 Puedes hacer clic en cualquier texto del documento para editarlo antes de imprimir.
                </div>
            </div>

            {/* Documento A4 Visual (Sombra y padding en pantalla pero que no va al PDF) */}
            <div className={styles.a4VisualContainer}>

                {/* Este div es el que realmente se captura y NO tiene padding visual, el padding se añade con la configuración "margin" de html2pdf */}
                <div className={styles.a4PDFContent} ref={documentRef}>

                    {/* Cabecera con Logo y Textos */}
                    <div className={styles.headerSection}>
                        <img
                            src="/logo-sas.png"
                            alt="Logo SAS"
                            className={styles.logoSas}
                            onError={(e) => {
                                // Si el usuario aún no ha subido el logo, esto lo oculta
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className={styles.headerTexts}>
                            <div
                                className={styles.hospitalName}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                Hospital Universitario Puerto Real
                            </div>
                            <div
                                className={styles.headerGlobal}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                Servicio de Obstetricia y Ginecología. Dr. Fernández Alba
                            </div>
                        </div>
                    </div>

                    <div
                        className={styles.documentTitle}
                        contentEditable
                        suppressContentEditableWarning
                    >
                        Parte de Quirófano <strong>({tipoQuirofano})</strong> {fechaStr}
                    </div>

                    {/* Tabla Editable */}
                    <table className={styles.documentTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '22%' }}>PACIENTE</th>
                                <th style={{ width: '18%' }}>DIAGNÓSTICO</th>
                                <th style={{ width: '25%' }}>INTERVENCIÓN</th>
                                <th style={{ width: '15%' }}>EQUIPO</th>
                                <th style={{ width: '20%' }}>OBSERVACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pacientes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }} contentEditable suppressContentEditableWarning>
                                        No hay pacientes asignados a este quirófano.
                                    </td>
                                </tr>
                            ) : (
                                pacientes.map((p, index) => (
                                    <tr key={p.rdq || index}>
                                        <td contentEditable suppressContentEditableWarning className={styles.editableCell}>
                                            <div style={{ fontWeight: 600 }}>{p.paciente?.toUpperCase()}</div>
                                            {p.nhc && <div>NHC: {p.nhc}</div>}
                                            {p.rdq && <div>RDQ: {p.rdq}</div>}
                                            {p.telefonos && <div>Tfno: {p.telefonos}</div>}
                                        </td>
                                        <td contentEditable suppressContentEditableWarning className={styles.editableCell}>
                                            {p.diagnostico}
                                        </td>
                                        <td contentEditable suppressContentEditableWarning className={styles.editableCell}>
                                            {p.procedimiento || p.intervencion_propuesta}
                                        </td>
                                        <td contentEditable suppressContentEditableWarning className={styles.editableCell}>
                                            {cirujanosStr.map((c: string, i: number) => (
                                                <div key={i}>{c}</div>
                                            ))}
                                        </td>
                                        <td contentEditable suppressContentEditableWarning className={styles.editableCell}>
                                            {p.observaciones || p.comentarios ? (
                                                <>
                                                    {p.observaciones && <div>{p.observaciones}</div>}
                                                    {p.comentarios && <div style={{ marginTop: '4px' }}>{p.comentarios}</div>}
                                                </>
                                            ) : (
                                                <div style={{ color: '#999', fontStyle: 'italic' }}>Clic para añadir observaciones...</div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SendEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                cirujanosMails={cirujanosMailsForModal}
                onSend={handleSendEmail}
                defaultSubject={defaultSubject}
                defaultMessage={defaultMessage}
            />
        </div>
    );
}
