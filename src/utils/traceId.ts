/**
 * Generate a trace ID for request tracing.
 * Format: <METHOD>-<ROUTE>-<USER_ADDRESS>-<RANDOMNESS>
 * 
 * @param method - HTTP method (get, post, put, delete)
 * @param route - API route being called
 * @param userAddress - User's wallet address
 * @returns Formatted trace ID string
 * 
 * @example
 * generateTraceId('get', '/api/jobs/user/0x1234567890abcdef', '0x1234567890abcdef')
 * // Returns: 'get-jobsuser-abcdef-a1b2c3d4'
 */
export function generateTraceId(
    method: string,
    route: string,
    userAddress: string
): string {
    // Normalize method to lowercase
    const normalizedMethod = method.toLowerCase();

    // Sanitize route: remove leading slash, api prefix, and special characters
    // Also remove any address-like segments and truncate
    let sanitizedRoute = route
        .replace(/^\/+/, '')          // Remove leading slashes
        .replace(/^api\//, '')        // Remove 'api/' prefix
        .replace(/0x[a-fA-F0-9]+/g, '') // Remove ethereum addresses
        .replace(/[\/\-_]+/g, '')     // Remove slashes, dashes, underscores
        .toLowerCase();

    // Truncate route to max 20 chars
    if (sanitizedRoute.length > 20) {
        sanitizedRoute = sanitizedRoute.substring(0, 20);
    }

    // Extract last 6 characters of user address (without 0x prefix handling)
    const addressSuffix = userAddress
        ? userAddress.toLowerCase().slice(-6)
        : '000000';

    // Generate randomness using crypto-safe random
    const randomness = generateRandomSuffix();

    return `${normalizedMethod}-${sanitizedRoute}-${addressSuffix}-${randomness}`;
}

/**
 * Generate a random suffix for the trace ID.
 * Uses crypto.randomUUID() if available, falls back to Math.random().
 */
function generateRandomSuffix(): string {
    // Use crypto.randomUUID() if available (Node.js 14.17+, browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        const uuid = crypto.randomUUID();
        // Take first 8 characters of UUID for shorter trace ID
        return uuid.replace(/-/g, '').substring(0, 8);
    }

    // Fallback to Math.random-based generation
    return Math.random().toString(36).substring(2, 10);
}
