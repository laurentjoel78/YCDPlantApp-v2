import { BASE_URL } from '../services/api';

/**
 * Helper to get a valid image source for React Native Image component.
 * Handles:
 * 1. Full URLs (https://...) -> returns { uri: path }
 * 2. Data URIs (data:image/...) -> returns { uri: path }
 * 3. Relative paths (/uploads/...) -> prepends BASE_URL and returns { uri: ... }
 * 4. Null/Undefined/Empty -> returns a fallback local image or placeholder object
 */
export const getImageUrl = (path: string | null | undefined): { uri: string } | any => {
    if (!path) {
        // Return a default placeholder. 
        // Note: You might want to import a local assest like require('../assets/placeholder.png')
        // For now, returning a generic object that Image component can handle or a transparent pixel
        return { uri: 'https://via.placeholder.com/150' };
    }

    if (typeof path !== 'string') {
        return { uri: 'https://via.placeholder.com/150' };
    }

    // Check if it's already a full URL (including Cloudinary URLs)
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return { uri: path };
    }

    // It's a relative path, prepend API base URL
    // Ensure we don't have double slashes if path starts with / and base ends with /
    const cleanBase = BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return { uri: `${cleanBase}${cleanPath}` };
};
