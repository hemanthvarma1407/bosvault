'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/api/services';
import { disconnectAllSockets } from '@/lib/socket';
import { LoginUserModel, LoginResponseModel } from '@bosvault/shared-models';
import { useToast } from './ToastContext';

interface User {
    id: number;
    fullName: string;
    email: string;
    companyId: number;
    role?: string;
    roles?: string[];
    phNumber?: string;
    department?: string;
    createdAt?: Date | string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    allowedMenus: any[];
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginUserModel) => Promise<User | undefined>;
    loginWithTokens: (accessToken: string, refreshToken: string) => Promise<User | undefined>;
    logout: () => Promise<void>;
    updateMenus: (menus: any[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [allowedMenus, setAllowedMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user');
            const storedMenus = localStorage.getItem('auth_menus');

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                if (storedMenus) {
                    setAllowedMenus(JSON.parse(storedMenus));
                }

                // Fetch latest profile and menus to ensure we're not showing stale data
                authService.getMe().then(response => {
                    if (response.status) {
                        if (response.menus) {
                            setAllowedMenus(response.menus);
                            localStorage.setItem('auth_menus', JSON.stringify(response.menus));
                        }
                        const userData: User = {
                            id: response.userInfo.id,
                            fullName: response.userInfo.fullName,
                            email: response.userInfo.email,
                            companyId: response.userInfo.companyId,
                            role: response.userInfo.role,
                            roles: response.userInfo.roles,
                            phNumber: response.userInfo.phNumber,
                            department: response.userInfo.department,
                            createdAt: response.userInfo.createdAt,
                        };
                        setUser(userData);
                        localStorage.setItem('auth_user', JSON.stringify(userData));
                    }
                }).catch(err => {
                    console.error('Failed to refresh menus:', err);
                });
            } else if (storedUser && !storedToken) {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('auth_menus');
                setUser(null);
                setToken(null);
                setAllowedMenus([]);
            }
        } catch (error) {
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_menus');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateMenus = (menus: any[]) => {
        setAllowedMenus(menus);
        localStorage.setItem('auth_menus', JSON.stringify(menus));
    };

    const login = async (credentials: LoginUserModel): Promise<User | undefined> => {
        try {
            const loginData = new LoginUserModel(
                credentials.email,
                credentials.password
            );
            const response: LoginResponseModel = await authService.loginUser(loginData);
            const tokenToSave = response.accessToken || (response as any)?.access_token;
            if (response.status && tokenToSave) {
                const userData: User = {
                    id: response.userInfo.id,
                    fullName: response.userInfo.fullName,
                    email: response.userInfo.email,
                    companyId: response.userInfo.companyId,
                    role: response.userInfo.role,
                    roles: response.userInfo.roles,
                    phNumber: response.userInfo.phNumber,
                    department: response.userInfo.department,
                    createdAt: response.userInfo.createdAt,
                };
                setUser(userData);
                setToken(tokenToSave);
                if (response.menus) {
                    setAllowedMenus(response.menus);
                }
                try {
                    localStorage.setItem("auth_token", tokenToSave);
                    localStorage.setItem("auth_user", JSON.stringify(userData));
                    if (response.menus) {
                        localStorage.setItem("auth_menus", JSON.stringify(response.menus));
                    }
                    if (response.refreshToken) {
                        localStorage.setItem("refresh_token", response.refreshToken);
                    }
                    // Reset socket connections to ensure they pick up the new token
                    disconnectAllSockets();
                } catch (error: any) {
                    console.error('Storage Error:', error);
                }
                return userData;
            }
            throw new Error(response.message || 'Login Failed');
        } catch (error: any) {
            console.error('Login Context Error:', error);
            throw error;
        }
    };

    const loginWithTokens = async (accessToken: string, refreshToken: string): Promise<User | undefined> => {
        try {
            localStorage.setItem("auth_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);

            // We need to fetch user info if we don't have it. 
            // However, the backend login response usually gives it.
            // For OAuth, I could pass the user info in the redirect URl too, or fetch a "me" endpoint.
            // Let's assume we can fetch user profile or that we received it.
            // Since I only passed tokens in the redirect, I'll add a 'getMe' endpoint to authService if it doesn't exist, 
            // or just use the tokens to fetch info.

            // For now, I'll fetch the profile to populate the context properly.
            const response = await authService.getMe();
            if (response.status) {
                const userData: User = {
                    id: response.userInfo.id,
                    fullName: response.userInfo.fullName,
                    email: response.userInfo.email,
                    companyId: response.userInfo.companyId,
                    role: response.userInfo.role,
                    roles: response.userInfo.roles,
                    phNumber: response.userInfo.phNumber,
                    department: response.userInfo.department,
                    createdAt: response.userInfo.createdAt,
                };
                setUser(userData);
                setToken(accessToken);
                if (response.menus) {
                    setAllowedMenus(response.menus);
                }
                localStorage.setItem("auth_user", JSON.stringify(userData));
                if (response.menus) {
                    localStorage.setItem("auth_menus", JSON.stringify(response.menus));
                }
                return userData;
            }
            throw new Error('Failed to fetch user profile');
        } catch (error: any) {
            console.error('Login with tokens error:', error);
            throw error;
        }
    };

    const logout = useCallback(async () => {
        try {
            if (user && token) {
                await authService.logOutUser({ email: user.email, token: token, });
            }
        } catch (error: any) {
            toast.error(error?.message);
        } finally {
            setUser(null);
            setToken(null);
            setAllowedMenus([]);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth_menus');
            disconnectAllSockets();
        }
    }, [user, token, toast]);

    return (
        <AuthContext.Provider value={{ user, token, allowedMenus, isLoading, isAuthenticated: !!user && !!token, login, loginWithTokens, logout, updateMenus }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
