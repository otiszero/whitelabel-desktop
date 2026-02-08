/**
 * Memory Security Utilities
 * Secure handling of sensitive data in memory
 */
/**
 * Zero-fill a buffer to prevent data leakage
 */
export function secureZeroFill(buffer) {
    if (!buffer || buffer.length === 0)
        return;
    buffer.fill(0);
}
/**
 * Execute a function with a buffer, then securely clear it
 */
export function withSecureBuffer(data, fn) {
    try {
        return fn(data);
    }
    finally {
        secureZeroFill(data);
    }
}
/**
 * Execute an async function with a buffer, then securely clear it
 */
export async function withSecureBufferAsync(data, fn) {
    try {
        return await fn(data);
    }
    finally {
        secureZeroFill(data);
    }
}
/**
 * Create a buffer from hex, use it, then clear it
 */
export function withHexBuffer(hex, fn) {
    const buffer = Buffer.from(hex, 'hex');
    return withSecureBuffer(buffer, fn);
}
/**
 * Securely compare two buffers in constant time
 * Prevents timing attacks
 */
export function secureCompare(a, b) {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}
