/**
 * Utilidades de Cifrado - AES-256-GCM + Blind Indices
 * 
 * Campos cifrados: paciente, NHC (ver arquitectura.md §3.2)
 * Blind indices: Hashes deterministas para búsquedas exactas.
 * 
 * IMPORTANTE: Estas funciones se ejecutan SOLO en el servidor (Server Actions / API Routes).
 * La clave de cifrado NUNCA debe estar en variables NEXT_PUBLIC_*.
 */

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            '[GineLeq Crypto] ENCRYPTION_KEY no configurada en .env.local'
        );
    }
    return key;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --------------------------------------------------------------------------
// Interfaz pública
// --------------------------------------------------------------------------

export interface EncryptedData {
    ciphertext: string;  // Base64
    iv: string;          // Base64
}

/**
 * Cifra un texto plano con AES-256-GCM.
 * El tag de autenticación se concatena al ciphertext (últimos 16 bytes).
 */
export async function encrypt(plaintext: string): Promise<EncryptedData> {
    const keyMaterial = base64ToArrayBuffer(getEncryptionKey());

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

/**
 * Descifra un texto cifrado con AES-256-GCM.
 */
export async function decrypt(data: EncryptedData): Promise<string> {
    const keyMaterial = base64ToArrayBuffer(getEncryptionKey());

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const iv = new Uint8Array(base64ToArrayBuffer(data.iv));
    const ciphertext = base64ToArrayBuffer(data.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Genera un Blind Index (HMAC-SHA256 determinista) para búsquedas exactas.
 * 
 * Uso: createBlindIndex("12345678") → hash fijo que se puede buscar con WHERE.
 * Limitación: solo permite búsquedas exactas, no parciales.
 */
export async function createBlindIndex(value: string): Promise<string> {
    const keyMaterial = base64ToArrayBuffer(getEncryptionKey());

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const encoded = new TextEncoder().encode(value.toLowerCase().trim());

    const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoded
    );

    return arrayBufferToBase64(signature);
}
