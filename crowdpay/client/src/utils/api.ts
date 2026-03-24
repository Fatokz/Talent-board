// src/utils/api.ts

// Grabbing the base URL from your env
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    // Using a typed fetch for better IntelliSense
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    return response;
};