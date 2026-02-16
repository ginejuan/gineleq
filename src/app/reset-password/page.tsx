'use client';

import { useState } from 'react';
import { updatePasswordAction } from '../login/actions';
import styles from '../login/auth.module.css';

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const res = await updatePasswordAction(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                setSuccess(true);
            }
        } catch {
            setError('Error al actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <div className={styles.successMessage}>
                        ✅ Tu contraseña ha sido actualizada correctamente.
                    </div>
                    <div className={styles.authFooter}>
                        <a href="/login" className={styles.submitButton}>
                            Iniciar Sesión
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Nueva Contraseña</h1>
                <form action={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>Contraseña</label>
                        <input name="password" type="password" required className={styles.formInput} minLength={6} placeholder="Nueva contraseña" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.formLabel}>Confirmar Contraseña</label>
                        <input name="confirmPassword" type="password" required className={styles.formInput} minLength={6} placeholder="Repetir contraseña" />
                    </div>

                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
