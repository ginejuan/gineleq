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
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            className={styles.formInput}
                        />
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
                    <span className={styles.authDivider}>|</span>
                    <Link href="/registro">Crear cuenta</Link>
                </div>
            </div>
        </div>
    );
}
