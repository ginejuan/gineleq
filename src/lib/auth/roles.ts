/**
 * roles.ts — Helpers de autorización por rol
 *
 * Encapsula la lógica de permisos para evitar esparcir
 * condiciones de rol por toda la app.
 */

export type AppRole = 'admin' | 'gestor' | 'consulta';

/** ¿Puede crear/editar/eliminar datos generales? */
export function canEdit(role: AppRole): boolean {
    return role === 'admin' || role === 'gestor';
}

/** ¿Es Administrador? */
export function isAdmin(role: AppRole): boolean {
    return role === 'admin';
}

/** Rutas a las que solo puede acceder el admin */
export const ADMIN_ONLY_ROUTES = [
    '/cirujanos',
    '/importacion',
    '/admin',
];

/** Rutas donde Gestor y Admin pueden escribir pero Consulta solo lee */
export const GESTOR_ROUTES = [
    '/agenda',
    '/programacion',
    '/listas',
    '/lista-espera',
];
