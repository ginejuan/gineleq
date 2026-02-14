'use client';

/**
 * Página de Registro
 * 
 * Formulario: nombre + apellidos + email + contraseña + confirmar contraseña.
 * 
 * Responsabilidad: SOLO presentación visual.
 * La lógica de registro está en /login/actions.ts.
 */

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from '../login/actions';
import styles from '../login/auth.module.css';

export default function RegistroPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const result = await registerAction(formData);
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
                    <span className={styles.authLogo}>🏥</span>
                    <h1 className={styles.authTitle}>Crear Cuenta</h1>
                    <p className={styles.authSubtitle}>
                        Regístrate para acceder a GineLeq
                    </p>
                </div>

                {success ? (
                    <div className={styles.successMessage}>
                        ✅ Cuenta creada correctamente. Ya puedes iniciar sesión.
                    </div>
                ) : (
                    <form action={handleSubmit} className={styles.authForm}>
                        {error && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="firstName" className={styles.formLabel}>
                                    Nombre
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="Ej: María"
                                    required
                                    autoComplete="given-name"
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="lastName" className={styles.formLabel}>
                                    Apellidos
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Ej: García López"
                                    required
                                    autoComplete="family-name"
                                    className={styles.formInput}
                                />
                            </div>
                        </div>

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

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.formLabel}>
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className={styles.formInput}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.formLabel}>
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repite la contraseña"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className={styles.formInput}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitButton}
                        >
                            {loading ? 'Registrando...' : 'Crear Cuenta'}
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
