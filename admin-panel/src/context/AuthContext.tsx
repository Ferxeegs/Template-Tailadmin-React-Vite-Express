import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, getAuthToken, removeAuthToken, setAuthToken, setRefreshToken, setAdminToken } from '../utils/api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  fullname: string | null;
  phone_number?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: {
    id: string;
    name: string;
    guard_name: string;
  }[];
  permissions?: {
    id: string;
    name: string;
    guard_name: string;
  }[];
  user_profile?: {
    id: string;
    nim: string;
    major: string | null;
    faculty: string | null;
    room_number: string | null;
    is_verified: boolean;
  } | null;
}

interface ImpersonateInfo {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonatedBy: ImpersonateInfo | null;
  hasSuperAdminRole: boolean;
  hasPermission: (permission: string | string[]) => boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonate: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedBy, setImpersonatedBy] = useState<ImpersonateInfo | null>(null);

  // Helper function to check if user has superadmin role
  const hasSuperAdminRole = (userRoles?: { id: string; name: string; guard_name: string }[]): boolean => {
    if (!userRoles || userRoles.length === 0) return false;
    return userRoles.some(role => role.name === 'superadmin');
  };

  // Helper function to check if user has permission
  const hasPermission = (permission: string | string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) return false;
    
    const userPermissionNames = user.permissions.map(p => p.name);
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    
    // Check if user has at least one of the required permissions (OR logic)
    return requiredPermissions.some(perm => userPermissionNames.includes(perm));
  };

  const fetchUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      setIsImpersonating(false);
      setImpersonatedBy(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await authAPI.getMe();
      
      if (response.success && response.data) {
        setUser(response.data);
        
        // Check if backend returned impersonatedBy info (from getMe response)
        if (response.data.impersonatedBy) {
          setIsImpersonating(true);
          setImpersonatedBy(response.data.impersonatedBy);
        } else {
          // Also check token as fallback
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (payload.isImpersonating && payload.impersonatedBy) {
                setIsImpersonating(true);
                // If backend didn't return impersonatedBy, we'll need to fetch it
                // But for now, we'll just set the flag
              } else {
                setIsImpersonating(false);
                setImpersonatedBy(null);
              }
            }
          } catch (e) {
            // Ignore token parsing errors
            setIsImpersonating(false);
            setImpersonatedBy(null);
          }
        }
      } else {
        // Token invalid, remove it
        removeAuthToken();
        setUser(null);
        setIsImpersonating(false);
        setImpersonatedBy(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      removeAuthToken();
      setUser(null);
      setIsImpersonating(false);
      setImpersonatedBy(null);
    } finally {
      setIsLoading(false);
    }
  };

  const impersonate = async (userId: string) => {
    try {
      // Save current token as admin token before impersonating
      const currentToken = getAuthToken();
      if (currentToken) {
        setAdminToken(currentToken);
      }

      // Save current URL before impersonating
      const currentUrl = window.location.pathname;
      localStorage.setItem('admin_last_url', currentUrl);

      const response = await authAPI.impersonate(userId);
      
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        // Set user data from response (includes permissions)
        setUser(response.data.user);
        setIsImpersonating(true);
        setImpersonatedBy(response.data.impersonatedBy);
        
        // Fetch user data again to ensure permissions are up to date
        await fetchUser();
      } else {
        throw new Error(response.message || 'Gagal melakukan impersonate');
      }
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      throw error;
    }
  };

  const stopImpersonate = async () => {
    try {
      const response = await authAPI.stopImpersonate();
      
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setUser(response.data.user);
        setIsImpersonating(false);
        setImpersonatedBy(null);
        // Remove admin token
        localStorage.removeItem('admin_token');
        
        // Fetch user data again to update roles and other info
        await fetchUser();
        
        // Return the saved URL to redirect to
        const savedUrl = localStorage.getItem('admin_last_url') || '/users';
        localStorage.removeItem('admin_last_url');
        
        return savedUrl;
      } else {
        throw new Error(response.message || 'Gagal keluar dari impersonate');
      }
    } catch (error: any) {
      console.error('Error stopping impersonate:', error);
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setIsImpersonating(false);
    setImpersonatedBy(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isImpersonating,
    impersonatedBy,
    hasSuperAdminRole: hasSuperAdminRole(user?.roles),
    hasPermission,
    fetchUser,
    logout,
    impersonate,
    stopImpersonate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

