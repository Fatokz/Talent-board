/**
 * authErrors.ts
 * Maps raw auth error codes to clean, user-friendly messages.
 * Never exposes internal backend/service names to the user.
 */

const AUTH_ERROR_MAP: Record<string, string> = {
    // Sign-in
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/user-not-found': 'No account found with that email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',

    // Sign-up
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
    'auth/weak-password': 'Your password is too weak. Use at least 8 characters.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',

    // Google / OAuth
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
    'auth/unauthorized-domain': 'Sign-in is not configured for this domain. Please contact support.',
    'auth/cancelled-popup-request': 'Another sign-in is already in progress.',
    'auth/account-exists-with-different-credential':
        'An account already exists with the same email using a different sign-in method.',

    // Network
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/timeout': 'The request timed out. Please try again.',
};

/**
 * Takes any auth error (raw Error or { code, message } object)
 * and returns a clean, user-safe string with no internal branding.
 */
export function friendlyAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (!err) return fallback;

    // Extract the error code
    const code = (err as any)?.code ?? '';

    if (code && AUTH_ERROR_MAP[code]) {
        return AUTH_ERROR_MAP[code];
    }

    // Scrub any raw message that leaks internal service names
    const raw: string = (err as any)?.message ?? String(err);
    // Remove patterns like "Firebase: Error (auth/xxx)." or "FirebaseError:" etc.
    const cleaned = raw
        .replace(/Firebase:\s*/gi, '')
        .replace(/FirebaseError:\s*/gi, '')
        .replace(/\(auth\/[a-z-]+\)\.?/gi, '')
        .trim();

    return cleaned || fallback;
}
