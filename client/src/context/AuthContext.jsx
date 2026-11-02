
// import { createContext, useContext, useState } from 'react';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//     const [token, setToken] = useState(
//         () => localStorage.getItem('token')
//     );

//     const login = (newToken) => {
//         localStorage.setItem('token', newToken);
//         setToken(newToken);
//     };

//     const logout = () => {
//         localStorage.removeItem('token');
//         setToken(null);
//     };

//     return (
//         <AuthContext.Provider
//             value={{
//                 token,
//                 isAuthenticated: !!token,
//                 login,
//                 logout
//             }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//     const context = useContext(AuthContext);

//     if (!context) {
//         throw new Error(
//             'useAuth must be used inside AuthProvider'
//         );
//     }

//     return context;
// }

import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        () => localStorage.getItem('token')
    );

    // Listen for expired or invalid JWT sessions
    useEffect(() => {
        const handleSessionExpired = () => {
            localStorage.removeItem('token');
            setToken(null);
        };

        window.addEventListener(
            'auth:expired',
            handleSessionExpired
        );

        return () => {
            window.removeEventListener(
                'auth:expired',
                handleSessionExpired
            );
        };
    }, []);

    // Login user
    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    // Logout user
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider'
        );
    }

    return context;
}
