'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { updatePasswordAction } from '../login/actions';
import styles from '../login/auth.module.css';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const isInvited = searchParams.get('invited') === '1';

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
                        ✅ {isInvited
                            ? 'Contraseña configurada correctamente. ¡Bienvenido a GineLeq!'
                            : 'Tu contraseña ha sido actualizada correctamente.'}
                    </div>
                    <div className={styles.authFooter}>
                        <a href="/dashboard" className={styles.submitButton}>
                            Entrar a la aplicación
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>🏥</span>
                    <h1 className={styles.authTitle}>GineLeq</h1>
                    <p className={styles.authSubtitle}>
                        {isInvited
                            ? 'Bienvenido. Por favor, establece tu contraseña para activar tu cuenta.'
                            : 'Introduce tu nueva contraseña.'}
                    </p>
                </div>
                <form action={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>Contraseña</label>
                        <input name="password" id="password" type="password" required className={styles.formInput} minLength={6} placeholder="Nueva contraseña" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.formLabel}>Confirmar Contraseña</label>
                        <input name="confirmPassword" id="confirmPassword" type="password" required className={styles.formInput} minLength={6} placeholder="Repetir contraseña" />
                    </div>

                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? 'Guardando...' : (isInvited ? 'Activar cuenta' : 'Cambiar Contraseña')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
}
