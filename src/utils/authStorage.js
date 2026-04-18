export const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('token');
};

export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('user');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setAuthSession = ({ token, user }) => {
    if (typeof window === 'undefined') return;

    if (token) {
        window.localStorage.setItem('token', token);
    }

    if (user) {
        window.localStorage.setItem('user', JSON.stringify(user));
    }
};

export const updateStoredUser = (user) => {
    if (typeof window === 'undefined' || !user) return;
    window.localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
};
