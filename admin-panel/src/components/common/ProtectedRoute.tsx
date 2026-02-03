import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import NotFound from "../../pages/OtherPage/NotFound";
import Forbidden from "../../pages/OtherPage/Forbidden";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  fallback?: ReactNode;
}

/**
 * ProtectedRoute component untuk melindungi route berdasarkan permission
 * Jika user tidak memiliki permission yang diperlukan, akan menampilkan halaman 404
 */
export default function ProtectedRoute({
  children,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { hasPermission, isLoading, isAuthenticated, user } = useAuth();

  // Jika masih loading, tampilkan loading state atau null
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Jika tidak authenticated, redirect ke signin
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Cek jika user memiliki role "mahasiswa", block akses ke admin panel
  if (user?.roles && user.roles.some(role => role.name.toLowerCase() === 'mahasiswa')) {
    // Render Forbidden menggunakan Portal ke body agar benar-benar full screen tanpa header/sidebar
    return createPortal(<Forbidden />, document.body);
  }

  // Jika ada requiredPermission dan user tidak memiliki permission, tampilkan 404
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Render NotFound menggunakan Portal ke body agar benar-benar full screen tanpa header
    return fallback || createPortal(<NotFound />, document.body);
  }

  // Jika semua checks passed, render children
  return <>{children}</>;
}

