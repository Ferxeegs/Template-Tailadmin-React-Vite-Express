import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { userAPI } from "../../utils/api";
import { PencilIcon, TrashBinIcon, UserCircleIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import TableSkeleton from "../../components/common/TableSkeleton";

interface User {
  id: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  fullname: string | null;
  phone_number: string | null;
  created_at: string | null;
  deleted_at?: string | null;
  user_profile: {
    id: string;
    nim: string;
    major: string | null;
    faculty: string | null;
    room_number: string | null;
    is_verified: boolean;
  } | null;
}

export default function UsersList() {
  const navigate = useNavigate();
  const { impersonate, hasSuperAdminRole, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  const fetchUsers = async (forceLoading = false) => {
    // Hanya set loading jika force loading atau benar-benar tidak ada data
    if (forceLoading || users.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = showDeleted
        ? await userAPI.getDeletedUsers({
            page,
            limit: 10,
            search: search.trim() || undefined,
          })
        : await userAPI.getAllUsers({
            page,
            limit: 10,
            search: search.trim() || undefined,
          });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "Gagal mengambil data users");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Saat page atau showDeleted berubah, fetch data
    // Loading hanya akan di-set jika tidak ada data (di dalam fetchUsers)
    fetchUsers(false);
  }, [page, showDeleted]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleImpersonate = async (userId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin masuk sebagai user ini? Anda akan melihat aplikasi dari perspektif user tersebut.")) {
      return;
    }

    setImpersonatingUserId(userId);
    setError(null);

    try {
      await impersonate(userId);
      // Redirect to dashboard or home after impersonating
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat melakukan impersonate");
      console.error("Impersonate user error:", err);
    } finally {
      setImpersonatingUserId(null);
    }
  };

  const handleForceDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus permanen user "${userName}"? Tindakan ini TIDAK DAPAT DIBATALKAN dan akan menghapus semua data terkait.`)) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);

    try {
      const response = await userAPI.forceDeleteUser(userId);

      if (response.success) {
        // Refresh list
        fetchUsers();
      } else {
        setError(response.message || "Gagal menghapus user permanen");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat menghapus user permanen");
      console.error("Force delete user error:", err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const getInitials = (user: User) => {
    if (user.fullname) {
      const names = user.fullname.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.fullname.substring(0, 2).toUpperCase();
    }
    if (user.firstname && user.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari user (nama, email, username)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          <svg
            className="absolute -translate-y-1/2 left-4 top-1/2 fill-gray-500 dark:fill-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowDeleted(!showDeleted);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showDeleted
                ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
          >
            {showDeleted ? "Show Active Users" : "Show Deleted Users"}
          </button>
          <button
            onClick={() => navigate("/users/create")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 sm:w-auto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create User
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          {isLoading && users.length === 0 ? (
            <TableSkeleton rows={10} columns={7} showAvatar={true} />
          ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {search 
              ? `Tidak ada ${showDeleted ? "deleted " : ""}user yang ditemukan` 
              : `Belum ada ${showDeleted ? "deleted " : ""}user`}
          </div>
        </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out forwards' }}>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    User
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Username
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Profile
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Tanggal Daftar
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(user)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.fullname || `${user.firstname} ${user.lastname}`.trim() || user.username}
                          </p>
                          {user.phone_number && (
                            <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {user.phone_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {user.username}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {user.user_profile ? (
                        <div className="text-theme-xs">
                          <div className="text-gray-500 dark:text-gray-400">
                            NIM: {user.user_profile.nim}
                          </div>
                          {user.user_profile.major && (
                            <div className="text-gray-500 dark:text-gray-400">
                              {user.user_profile.major}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-theme-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {user.user_profile ? (
                        <Badge
                          size="sm"
                          color={user.user_profile.is_verified ? "success" : "warning"}
                        >
                          {user.user_profile.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      ) : (
                        <Badge size="sm" color="light">
                          No Profile
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {!showDeleted && (
                          <>
                            {hasPermission(['view_user', 'view_any_user']) && (
                              <button
                                onClick={() => navigate(`/users/${user.id}/edit`)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                title="View/Edit User"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {hasSuperAdminRole && (
                              <button
                                onClick={() => handleImpersonate(user.id)}
                                disabled={impersonatingUserId === user.id}
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-500 transition-colors rounded-lg hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-800 dark:hover:text-blue-200"
                                title="Impersonate User"
                              >
                                <UserCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {showDeleted && (
                          <button
                            onClick={() => handleForceDelete(user.id, user.fullname || `${user.firstname} ${user.lastname}`.trim() || user.username)}
                            disabled={deletingUserId === user.id}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Force Delete (Permanent)"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                            {deletingUserId === user.id ? "Deleting..." : "Force Delete"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} dari {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

