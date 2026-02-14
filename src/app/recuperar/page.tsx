'use client';

/**
 * Página de Recuperar Contraseña
 * 
 * Formulario: solo email.
 * Envía un enlace de restablecimiento al email proporcionado.
 * 
 * Responsabilidad: SOLO presentación visual.
 * La lógica está en /login/actions.ts.
 */

import { useState } from 'react';
import Link from 'next/link';
import { resetPasswordAction } from '../login/actions';
import styles from '../login/auth.module.css';

export default function RecuperarPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const result = await resetPasswordAction(formData);
            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setSuccess(true);
            }
        } catch {
            setError('Error inesperado. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>🔑</span>
                    <h1 className={styles.authTitle}>Recuperar Contraseña</h1>
                    <p className={styles.authSubtitle}>
                        Te enviaremos un enlace para restablecer tu contraseña
                    </p>
                </div>

                {success ? (
                    <div className={styles.successMessage}>
                        ✅ Hemos enviado un email con instrucciones para restablecer tu contraseña.
                        Revisa tu bandeja de entrada.
                    </div>
                ) : (
                    <form action={handleSubmit} className={styles.authForm}>
                        {error && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.formLabel}>
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                                autoComplete="email"
                                className={styles.formInput}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitButton}
                        >
                            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                        </button>
                    </form>
                )}

                <div className={styles.authFooter}>
                    <Link href="/login">← Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    );
}
