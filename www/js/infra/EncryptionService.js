
export class EncryptionService {
    static encrypt(text) {
        try {
            if (!text) return '';
            // Codifica para UTF-8 bytes antes de Base64 para suportar acentos
            const utf8Bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g,
                (match, p1) => String.fromCharCode('0x' + p1)
            );
            return btoa(utf8Bytes);
        } catch (e) {
            console.error('[Encryption] Falha ao encriptar:', e);
            return '';
        }
    }

    static decrypt(encoded) {
        try {
            if (!encoded) return null;
            // Validação simples de Base64
            if (!/^[A-Za-z0-9+/=]+$/.test(encoded)) return null;
            
            const bytes = atob(encoded);
            const originalText = decodeURIComponent(bytes.split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            
            return originalText;
        } catch (e) {
            // Falha silenciosa conformada (Protocolo Áureo #4)
            return null;
        }
    }
}
