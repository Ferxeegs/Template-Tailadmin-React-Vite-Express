import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { userAPI, roleAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { ArrowRightIcon, InfoIcon, LockIcon, CheckLineIcon, AngleLeftIcon, TrashBinIcon, UserCircleIcon, EyeIcon, EyeCloseIcon } from "../../icons";
import UserSidebar from "./UserSidebar";
import DetailsTab from "./DetailsTab";
import RolesTab from "./RolesTab";
import UserProfileTab from "./UserProfileTab";

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { impersonate, hasSuperAdminRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "roles" | "user_profile">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    phone_number: "",
    email: "",
  });
  const [userProfileData, setUserProfileData] = useState({
    nim: "",
    major: "",
    faculty: "",
    room_number: "",
    is_verified: false,
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [hasMahasiswaRole, setHasMahasiswaRole] = useState(false);
  const [countryCode, setCountryCode] = useState<string>("+62");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const { isOpen: isResetPasswordModalOpen, openModal: openResetPasswordModal, closeModal: closeResetPasswordModal } = useModal();
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    if (!id) return;

    setIsFetching(true);
    setError(null);

    try {
      const response = await userAPI.getUserById(id);
      if (response.success && response.data) {
        const user = response.data;
        setUserData(user);
        // Parse phone_number to extract country code and number
        let phoneNumber = user.phone_number || "";
        let detectedCountryCode = "+62";
        
        if (phoneNumber) {
          // If phone starts with +62, extract it
          if (phoneNumber.startsWith("+62")) {
            detectedCountryCode = "+62";
            phoneNumber = phoneNumber.substring(3); // Remove +62
            // If starts with 0, keep it, otherwise add 0
            if (!phoneNumber.startsWith("0")) {
              phoneNumber = "0" + phoneNumber;
            }
          } else if (phoneNumber.startsWith("+1")) {
            detectedCountryCode = "+1";
            phoneNumber = phoneNumber.substring(2);
          } else if (phoneNumber.startsWith("0")) {
            // Indonesian number starting with 0
            detectedCountryCode = "+62";
            // Keep the 0
          } else {
            // Default to +62
            detectedCountryCode = "+62";
            // Add 0 if not present
            if (!phoneNumber.startsWith("0")) {
              phoneNumber = "0" + phoneNumber;
            }
          }
        }
        
        setCountryCode(detectedCountryCode);
        setFormData({
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          username: user.username || "",
          phone_number: phoneNumber,
          email: user.email || "",
        });
        setUserProfileData({
          nim: user.user_profile?.nim || "",
          major: user.user_profile?.major || "",
          faculty: user.user_profile?.faculty || "",
          room_number: user.user_profile?.room_number || "",
          is_verified: user.user_profile?.is_verified || false,
        });
        const roleIds = user.roles?.map((r: any) => r.id) || [];
        setSelectedRoleIds(roleIds);
        // Check if user has mahasiswa role
        const hasMahasiswa = user.roles?.some((r: any) => r.name === 'mahasiswa') || false;
        setHasMahasiswaRole(hasMahasiswa);
        
        // If user doesn't have mahasiswa role and is on user_profile tab, redirect to details
        if (!hasMahasiswa && activeTab === "user_profile") {
          setActiveTab("details");
        }
      } else {
        setError(response.message || "Gagal mengambil data user");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat mengambil data user");
      console.error("Fetch user error:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleFormChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleUserProfileChange = (name: string, value: string | boolean) => {
    setUserProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleEmailVerified = () => {
    fetchUserData();
  };

  const handleImpersonate = async () => {
    if (!id) return;

    if (!window.confirm("Apakah Anda yakin ingin masuk sebagai user ini? Anda akan melihat aplikasi dari perspektif user tersebut.")) {
      return;
    }

    setIsImpersonating(true);
    setError(null);

    try {
      await impersonate(id);
      // Redirect to dashboard or home after impersonating
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat melakukan impersonate");
      console.error("Impersonate user error:", err);
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;

    // Validasi
    if (!resetPasswordData.password || resetPasswordData.password.length < 8) {
      setResetPasswordError("Password minimal 8 karakter");
      return;
    }

    if (resetPasswordData.password !== resetPasswordData.confirm_password) {
      setResetPasswordError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);

    try {
      const response = await userAPI.resetPassword(id, {
        password: resetPasswordData.password,
        confirm_password: resetPasswordData.confirm_password,
      });

      if (response.success) {
        // Reset form dan tutup modal
        setResetPasswordData({
          password: "",
          confirm_password: "",
        });
        setResetPasswordError(null);
        closeResetPasswordModal();
        alert("Password berhasil direset");
      } else {
        setResetPasswordError(response.message || "Gagal reset password");
      }
    } catch (err: any) {
      setResetPasswordError(err.message || "Terjadi kesalahan saat reset password");
      console.error("Reset password error:", err);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!id) return;

    const userFullName = userData?.fullname || `${userData?.firstname} ${userData?.lastname}`.trim() || userData?.username || 'User';
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${userFullName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userAPI.deleteUser(id);

      if (response.success) {
        // Redirect ke users list setelah berhasil delete
        navigate("/users");
      } else {
        setError(response.message || "Gagal menghapus user");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat menghapus user");
      console.error("Delete user error:", err);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!id) return;

    // Client-side validation
    if (formData.firstname.trim().length < 2) {
      setError("Nama depan minimal 2 karakter");
      return;
    }

    if (formData.lastname.trim().length < 2) {
      setError("Nama belakang minimal 2 karakter");
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Format email tidak valid");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user has mahasiswa role before updating user profile
      const hasMahasiswa = userData?.roles?.some((r: any) => 
        selectedRoleIds.includes(r.id) && r.name === 'mahasiswa'
      ) || false;

      // Format phone number: combine country code with phone number
      let formattedPhoneNumber = null;
      if (formData.phone_number.trim()) {
        let phoneNum = formData.phone_number.trim();
        
        // Remove any existing country code prefix
        if (phoneNum.startsWith("+62")) {
          phoneNum = phoneNum.substring(3);
        } else if (phoneNum.startsWith("+1")) {
          phoneNum = phoneNum.substring(2);
        }
        
        // For Indonesian numbers (+62), format should be +62XXXXXXXXX (without leading 0)
        if (countryCode === "+62") {
          // Remove leading 0 if present
          if (phoneNum.startsWith("0")) {
            phoneNum = phoneNum.substring(1);
          }
          formattedPhoneNumber = "+62" + phoneNum;
        } else if (countryCode === "+1") {
          // For US numbers, just add the country code
          formattedPhoneNumber = "+1" + phoneNum;
        } else {
          // Default: use country code + number
          formattedPhoneNumber = countryCode + phoneNum;
        }
      }

      // Update user details
      const updateResponse = await userAPI.updateUser(id, {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        phone_number: formattedPhoneNumber,
        email: formData.email.trim() || undefined,
        // User profile fields - only if user has mahasiswa role
        ...(hasMahasiswa && {
          nim: userProfileData.nim.trim() || undefined,
          major: userProfileData.major.trim() || null,
          faculty: userProfileData.faculty.trim() || null,
          room_number: userProfileData.room_number.trim() || null,
          is_verified: userProfileData.is_verified,
        }),
      });

      if (!updateResponse.success) {
        setError(updateResponse.message || "Gagal mengupdate user");
        setIsLoading(false);
        return;
      }

      // Update user roles
      const rolesResponse = await userAPI.updateUserRoles(id, selectedRoleIds);

      if (!rolesResponse.success) {
        setError(rolesResponse.message || "Gagal mengupdate roles");
        setIsLoading(false);
        return;
      }

      // Check if user has mahasiswa role after role update
      // We need to fetch roles to check names
      const rolesListResponse = await roleAPI.getAllRoles({ limit: 100 });
      const rolesList = rolesListResponse.success && rolesListResponse.data 
        ? rolesListResponse.data.roles 
        : [];
      
      const updatedHasMahasiswa = selectedRoleIds.some((roleId) => {
        return rolesList.some((r: any) => r.id === roleId && r.name === 'mahasiswa');
      });
      
      setHasMahasiswaRole(updatedHasMahasiswa);
      
      // If user no longer has mahasiswa role and is on user_profile tab, redirect to details
      if (!updatedHasMahasiswa && activeTab === "user_profile") {
        setActiveTab("details");
      }

      // Success - redirect back to users list
      navigate("/users");
    } catch (err: any) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Update user error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <>
        <PageMeta
          title="Edit User | TailAdmin"
          description="Edit user information"
        />
        <PageBreadcrumb
          pageTitle={
            <div className="flex items-center gap-2">
              <Link
                to="/users"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Users
              </Link>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              <span>Edit User</span>
            </div>
          }
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Memuat data user...</div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <PageMeta
          title="Edit User | TailAdmin"
          description="Edit user information"
        />
        <PageBreadcrumb
          pageTitle={
            <div className="flex items-center gap-2">
              <Link
                to="/users"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Users
              </Link>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              <span>Edit User</span>
            </div>
          }
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 dark:text-red-400">
            {error || "User tidak ditemukan"}
          </div>
        </div>
      </>
    );
  }

  const userFullName = userData.fullname || `${userData.firstname} ${userData.lastname}`.trim() || userData.username;

  return (
    <>
      <PageMeta
        title={`Edit ${userFullName} | TailAdmin`}
        description="Edit user information"
      />
      <PageBreadcrumb
        pageTitle={
          <div className="flex items-center gap-2">
            <Link
              to="/users"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Users
            </Link>
            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            <span>{userFullName}</span>
            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            <span>Edit</span>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header with Title and Action Buttons */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit {userFullName}
          </h1>
          <div className="flex items-center gap-3">
            {hasSuperAdminRole && (
              <button
                type="button"
                onClick={handleImpersonate}
                disabled={isImpersonating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCircleIcon className="w-4 h-4" />
                {isImpersonating ? "Impersonating..." : "Impersonate"}
              </button>
            )}
            <button
              type="button"
              onClick={openResetPasswordModal}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
            >
              Reset Password
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <UserSidebar
              userId={id!}
              userEmail={userData.email}
              emailVerifiedAt={userData.email_verified_at}
              createdAt={userData.created_at}
              updatedAt={userData.updated_at}
              onEmailVerified={handleEmailVerified}
              profileImage={profileImage ? URL.createObjectURL(profileImage) : null}
              onProfileImageChange={setProfileImage}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "details"
                      ? "border-brand-500 text-brand-500"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <InfoIcon className="w-4 h-4" />
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roles")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "roles"
                      ? "border-brand-500 text-brand-500"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <LockIcon className="w-4 h-4" />
                  Roles
                </button>
                {hasMahasiswaRole && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("user_profile")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === "user_profile"
                        ? "border-brand-500 text-brand-500"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <UserCircleIcon className="w-4 h-4" />
                    User Profile
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                      {error}
                    </div>
                  )}

           {activeTab === "details" ? (
             <DetailsTab
               formData={formData}
               onChange={handleFormChange}
               isLoading={isLoading}
               countryCode={countryCode}
               onCountryCodeChange={setCountryCode}
             />
                  ) : activeTab === "roles" ? (
                    <RolesTab
                      selectedRoleIds={selectedRoleIds}
                      onRoleChange={setSelectedRoleIds}
                      isLoading={isLoading}
                    />
                  ) : (
                    <UserProfileTab
                      formData={userProfileData}
                      onChange={handleUserProfileChange}
                      isLoading={isLoading}
                    />
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate("/users")}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    <AngleLeftIcon className="w-4 h-4" />
                    Back
                  </button>
                  {hasPermission(['delete_user', 'delete_any_user']) && (
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  {hasPermission('create_user') && (
                    <button
                      type="button"
                      onClick={() => navigate("/users/create")}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Create Another
                    </button>
                  )}
                  {hasPermission('update_user') && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckLineIcon className="w-4 h-4" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetPasswordModalOpen} onClose={closeResetPasswordModal} className="max-w-md">
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter a new password for this user
            </p>
          </div>
          
          {/* Error Message */}
          {resetPasswordError && (
            <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              {resetPasswordError}
            </div>
          )}

          {/* Form */}
          <div className="space-y-3.5">
            <div>
              <Label className="text-sm">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={resetPasswordData.password}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Min. 8 characters"
                  disabled={isResettingPassword}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeCloseIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={resetPasswordData.confirm_password}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      confirm_password: e.target.value,
                    })
                  }
                  placeholder="Re-enter password"
                  disabled={isResettingPassword}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeCloseIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setResetPasswordError(null);
                setResetPasswordData({ password: "", confirm_password: "" });
                closeResetPasswordModal();
              }}
              disabled={isResettingPassword}
              className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="px-3.5 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResettingPassword ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
