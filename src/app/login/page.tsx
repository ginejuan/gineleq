'use client';

/**
 * Página de Login
 * 
 * Formulario de email + contraseña.
 * Links a registro y recuperación de contraseña.
 * 
 * Responsabilidad: SOLO presentación visual.
 * La lógica de auth está en actions.ts (server action).
 */

import { useState } from 'react';
import Link from 'next/link';
import { loginAction } from './actions';
import styles from './auth.module.css';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setLoading(true);

        try {
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
            }
        } catch {
            // loginAction redirige en éxito, por lo que un error aquí
            // es realmente el redirect de Next.js (no es un error real)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>🏥</span>
                    <h1 className={styles.authTitle}>GineLeq</h1>
                    <p className={styles.authSubtitle}>
                        Sistema de Gestión de Lista de Espera Quirúrgica
                    </p>
                </div>

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

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>
                            Contraseña
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className={styles.formInput}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
                </div>
            </div>
        </div>
    );
}
