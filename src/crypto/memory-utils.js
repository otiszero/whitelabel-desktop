"use strict";
/**
 * Memory Security Utilities
 * Secure handling of sensitive data in memory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureZeroFill = secureZeroFill;
exports.withSecureBuffer = withSecureBuffer;
exports.withSecureBufferAsync = withSecureBufferAsync;
exports.withHexBuffer = withHexBuffer;
exports.secureCompare = secureCompare;
/**
 * Zero-fill a buffer to prevent data leakage
 */
function secureZeroFill(buffer) {
    if (!buffer || buffer.length === 0)
        return;
    buffer.fill(0);
}
/**
 * Execute a function with a buffer, then securely clear it
 */
function withSecureBuffer(data, fn) {
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
async function withSecureBufferAsync(data, fn) {
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
function withHexBuffer(hex, fn) {
    const buffer = Buffer.from(hex, 'hex');
    return withSecureBuffer(buffer, fn);
}
/**
 * Securely compare two buffers in constant time
 * Prevents timing attacks
 */
function secureCompare(a, b) {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}
