/**
 * Módulo de Cifrado PII — AES-256-GCM
 * 
 * Cifra/descifra datos personales de pacientes (RGPD).
 * Campos cifrados: paciente, NHC, teléfonos, dirección.
 * 
 * Wrapper agnóstico: si mañana cambiamos el algoritmo,
 * solo se modifica este archivo.
 * 
 * SOLO para uso en servidor (Server Actions / API Routes).
 */

import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';

// --------------------------------------------------------------------------
// Configuración
// --------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recomendado para GCM
const TAG_LENGTH = 16;
const SEPARATOR = ':'; // iv:ciphertext:tag

function getEncryptionKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) {
        throw new Error(
            '[GineLeq Encryption] Falta ENCRYPTION_KEY en variables de entorno.'
        );
    }

    // Soporta hex (64 chars) o base64 (44 chars)
    if (raw.length === 64) {
        return Buffer.from(raw, 'hex');
    }
    return Buffer.from(raw, 'base64');
}

// --------------------------------------------------------------------------
// Cifrar
// --------------------------------------------------------------------------

/**
 * Cifra un texto plano con AES-256-GCM.
 * Retorna un string con formato: iv:ciphertext:tag (hex).
 * Si el valor está vacío, retorna string vacío.
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return '';

    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        encrypted.toString('hex'),
        tag.toString('hex'),
    ].join(SEPARATOR);
}

// --------------------------------------------------------------------------
// Descifrar
// --------------------------------------------------------------------------

/**
 * Descifra un valor cifrado con formato iv:ciphertext:tag.
 * Retorna el texto plano original.
 */
export function decrypt(encryptedValue: string): string {
    if (!encryptedValue) return '';

    const parts = encryptedValue.split(SEPARATOR);
    if (parts.length !== 3) {
        throw new Error('[GineLeq Encryption] Formato cifrado inválido.');
    }

    const [ivHex, ciphertextHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Intenta descifrar, y si falla retorna el valor original.
 * Útil para migraciones o datos mixtos.
 */
export function safeDecrypt(value: string): string {
    try {
        return decrypt(value);
    } catch {
        return value;
    }
}

// --------------------------------------------------------------------------
// Blind Index (para búsquedas sobre datos cifrados)
// --------------------------------------------------------------------------

/**
 * Genera un hash determinista (HMAC-SHA256) para búsquedas exactas
 * sobre campos cifrados, sin exponer el valor original.
 * 
 * Ejemplo: blindIndex("12345") siempre retorna el mismo hash.
 */
export function blindIndex(value: string): string {
    if (!value) return '';

    const key = getEncryptionKey();
    return createHmac('sha256', key)
        .update(value.toLowerCase().trim())
        .digest('hex')
        .slice(0, 32); // 16 bytes = suficiente para búsquedas
}
