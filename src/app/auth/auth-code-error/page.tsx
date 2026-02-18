'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthCodeErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#d32f2f' }}>Error de Autenticación</h1>
            <p>Hubo un problema verificando tu enlace de acceso.</p>
            {error && (
                <div style={{ background: '#ffebee', padding: '1rem', margin: '1rem auto', maxWidth: '500px', borderRadius: '4px' }}>
                    <strong>{error}</strong>
                    <p>{error_description}</p>
                </div>
            )}
            <p>Esto puede ocurrir si el enlace ha caducado o ya ha sido utilizado.</p>
            <Link href="/login" style={{ color: '#0070f3', textDecoration: 'underline' }}>
                Volver al inicio de sesión
            </Link>
        </div>
    );
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <AuthCodeErrorContent />
        </Suspense>
    );
}
