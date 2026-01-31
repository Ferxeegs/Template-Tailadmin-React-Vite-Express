/**
 * API Utility untuk komunikasi dengan backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Helper function untuk membuat request ke API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Tambahkan token jika ada
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Jika error dari backend, gunakan message atau error field
      const errorMessage = data.message || data.error || 'Terjadi kesalahan';
      return {
        success: false,
        message: errorMessage,
        error: data.error || data.message || errorMessage,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: 'Gagal terhubung ke server',
      error: error.message || 'Network error',
    };
  }
}

/**
 * Auth API functions
 */
export const authAPI = {
  /**
   * Register user baru
   */
  register: async (data: {
    username: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
  }) => {
    return apiRequest<{
      id: string;
      username: string;
      email: string;
      firstname: string;
      lastname: string;
      fullname: string;
      created_at: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Login user
   */
  login: async (data: { email: string; password: string }) => {
    return apiRequest<{
      user: {
        id: string;
        username: string;
        email: string;
        firstname: string;
        lastname: string;
        fullname: string;
      };
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user data
   */
  getMe: async () => {
    return apiRequest<{
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
      impersonatedBy?: {
        id: string;
        username: string;
        email: string;
      } | null;
    }>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Impersonate a user (admin only)
   */
  impersonate: async (userId: string) => {
    return apiRequest<{
      user: {
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
      };
      token: string;
      impersonatedBy: {
        id: string;
        username: string;
        email: string;
      };
    }>(`/auth/impersonate/${userId}`, {
      method: 'POST',
    });
  },

  /**
   * Stop impersonating and return to admin account
   */
  stopImpersonate: async () => {
    return apiRequest<{
      user: {
        id: string;
        username: string;
        email: string;
        firstname: string;
        lastname: string;
        fullname: string | null;
        phone_number?: string | null;
        created_at?: string;
        updated_at?: string;
        user_profile?: {
          id: string;
          nim: string;
          major: string | null;
          faculty: string | null;
          room_number: string | null;
          is_verified: boolean;
        } | null;
      };
      token: string;
    }>('/auth/stop-impersonate', {
      method: 'POST',
    });
  },
};

/**
 * Helper untuk menyimpan token
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

/**
 * Helper untuk menyimpan admin token asli (sebelum impersonate)
 */
export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token);
};

/**
 * Helper untuk menghapus token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('admin_token');
};

/**
 * Helper untuk mendapatkan token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Helper untuk mendapatkan admin token asli
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

/**
 * User API functions
 */
export const userAPI = {
  /**
   * Get all users with pagination and search
   */
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{
      users: Array<{
        id: string;
        username: string;
        email: string;
        firstname: string;
        lastname: string;
        fullname: string | null;
        phone_number: string | null;
        created_at: string | null;
        updated_at: string | null;
        user_profile: {
          id: string;
          nim: string;
          major: string | null;
          faculty: string | null;
          room_number: string | null;
          is_verified: boolean;
        } | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string) => {
    return apiRequest<{
      id: string;
      username: string;
      email: string;
      firstname: string;
      lastname: string;
      fullname: string | null;
      phone_number: string | null;
      email_verified_at: string | null;
      created_at: string | null;
      updated_at: string | null;
      roles: Array<{
        id: string;
        name: string;
        guard_name: string;
      }>;
      user_profile: {
        id: string;
        nim: string;
        major: string | null;
        faculty: string | null;
        room_number: string | null;
        is_verified: boolean;
      } | null;
    }>(`/users/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create new user
   */
  createUser: async (data: {
    username: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    fullname?: string | null;
    phone_number?: string | null;
    roleIds?: string[];
    nim?: string;
    major?: string | null;
    faculty?: string | null;
    room_number?: string | null;
    is_verified?: boolean;
  }) => {
    return apiRequest<{
      id: string;
      username: string;
      email: string;
      firstname: string;
      lastname: string;
      fullname: string | null;
      phone_number: string | null;
      created_at: string;
      updated_at: string;
      user_profile: {
        id: string;
        nim: string;
        major: string | null;
        faculty: string | null;
        room_number: string | null;
        is_verified: boolean;
      } | null;
      roles: Array<{
        id: string;
        name: string;
        guard_name: string;
      }>;
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user by ID
   */
  updateUser: async (id: string, data: {
    firstname: string;
    lastname: string;
    username?: string;
    fullname?: string | null;
    phone_number?: string | null;
    email?: string;
    // User profile fields
    nim?: string;
    major?: string | null;
    faculty?: string | null;
    room_number?: string | null;
    is_verified?: boolean;
  }) => {
    return apiRequest<{
      id: string;
      username: string;
      email: string;
      firstname: string;
      lastname: string;
      fullname: string | null;
      phone_number: string | null;
      created_at: string;
      updated_at: string;
      user_profile: {
        id: string;
        nim: string;
        major: string | null;
        faculty: string | null;
        room_number: string | null;
        is_verified: boolean;
      } | null;
    }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user roles
   */
  updateUserRoles: async (id: string, roleIds: string[]) => {
    return apiRequest<{
      roles: Array<{
        id: string;
        name: string;
        guard_name: string;
      }>;
    }>(`/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  /**
   * Get all deleted users
   */
  getDeletedUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `/users/deleted${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest<{
      users: Array<{
        id: string;
        username: string;
        email: string;
        firstname: string;
        lastname: string;
        fullname: string | null;
        phone_number: string | null;
        created_at: string | null;
        updated_at: string | null;
        deleted_at: string | null;
        user_profile: {
          id: string;
          nim: string;
          major: string | null;
          faculty: string | null;
          room_number: string | null;
          is_verified: boolean;
        } | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Delete user by ID (soft delete)
   */
  deleteUser: async (id: string) => {
    return apiRequest<null>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Force delete user by ID (hard delete)
   */
  forceDeleteUser: async (id: string) => {
    return apiRequest<null>(`/users/${id}/force`, {
      method: 'DELETE',
    });
  },

  /**
   * Verify user email
   */
  verifyUserEmail: async (id: string) => {
    return apiRequest<{
      email_verified_at: string;
    }>(`/users/${id}/verify-email`, {
      method: 'POST',
    });
  },

  /**
   * Send verification email
   */
  sendVerificationEmail: async (id: string) => {
    return apiRequest<{
      message: string;
    }>(`/users/${id}/send-verification-email`, {
      method: 'POST',
    });
  },

  /**
   * Reset user password (admin only)
   */
  resetPassword: async (id: string, data: { password: string; confirm_password: string }) => {
    return apiRequest<{
      message: string;
    }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Role API functions
 */
export const roleAPI = {
  /**
   * Get all roles with pagination and search
   */
  getAllRoles: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/roles${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{
      roles: Array<{
        id: string;
        name: string;
        guard_name: string;
        permissions_count: number;
        users_count: number;
        permissions: Array<{
          id: string;
          name: string;
          guard_name: string;
        }>;
        created_at: string | null;
        updated_at: string | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Get role by ID
   */
  getRoleById: async (id: string) => {
    return apiRequest<{
      id: string;
      name: string;
      guard_name: string;
      permissions_count: number;
      users_count: number;
      permissions: Array<{
        id: string;
        name: string;
        guard_name: string;
      }>;
      users: Array<{
        id: string;
        username: string;
        email: string;
        fullname: string | null;
      }>;
      created_at: string | null;
      updated_at: string | null;
    }>(`/roles/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Get all permissions
   */
  getAllPermissions: async () => {
    return apiRequest<{
      permissions: Array<{
        id: string;
        name: string;
        guard_name: string;
        created_at: string | null;
        updated_at: string | null;
      }>;
    }>('/roles/permissions', {
      method: 'GET',
    });
  },

  /**
   * Update role details (name, guard_name)
   */
  updateRole: async (id: string, data: { name: string; guard_name: string }) => {
    return apiRequest<{
      id: string;
      name: string;
      guard_name: string;
      created_at: string | null;
      updated_at: string | null;
    }>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update role permissions
   */
  updateRolePermissions: async (id: string, permissionIds: string[]) => {
    return apiRequest<{
      permissions: Array<{
        id: string;
        name: string;
        guard_name: string;
      }>;
    }>(`/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};

