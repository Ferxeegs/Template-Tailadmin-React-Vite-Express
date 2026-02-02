import { useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import { userAPI } from "../../utils/api";

interface UserSidebarProps {
  userId: string;
  userEmail: string;
  emailVerifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  onEmailVerified: () => void;
  profileImage?: string | null;
  onProfileImageChange?: (file: File | null) => void;
}

export default function UserSidebar({
  userId,
  emailVerifiedAt,
  // createdAt,
  // updatedAt,
  onEmailVerified,
  profileImage,
  onProfileImageChange,
}: UserSidebarProps) {
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(profileImage || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onProfileImageChange?.(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onProfileImageChange?.(null);
  };

  // const formatDate = (date: string | null) => {
  //   if (!date) return "-";
  //   const d = new Date(date);
  //   const now = new Date();
  //   const diffMs = now.getTime() - d.getTime();
  //   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
  //   if (diffDays === 0) return "Today";
  //   if (diffDays === 1) return "Yesterday";
  //   if (diffDays < 7) return `${diffDays} days ago`;
  //   if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  //   if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  //   return `${Math.floor(diffDays / 365)} years ago`;
  // };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      const response = await userAPI.sendVerificationEmail(userId);
      if (response.success) {
        alert("Email verifikasi berhasil dikirim");
      } else {
        alert(response.message || "Gagal mengirim email verifikasi");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengirim email verifikasi");
      console.error(err);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleMarkAsVerified = async () => {
    setIsVerifying(true);
    try {
      const response = await userAPI.verifyUserEmail(userId);
      if (response.success) {
        onEmailVerified();
      } else {
        alert(response.message || "Gagal memverifikasi email");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memverifikasi email");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Profile Picture Upload */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture
        </h3>
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
              {imagePreview ? "Change Photo" : "Upload Photo"}
            </span>
          </label>
        </div>
      </div>

      {/* Email Verification */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Verification
        </h3>
        <div className="space-y-3">
          {!emailVerifiedAt && (
            <>
              <button
                onClick={handleSendVerification}
                disabled={isSendingVerification}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingVerification ? "Sending..." : "Send verification"}
              </button>
              <button
                onClick={handleMarkAsVerified}
                disabled={isVerifying}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Verifying..." : "Mark as verified"}
              </button>
            </>
          )}
          <div className="pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Email verified at
            </div>
            {emailVerifiedAt ? (
              <div className="text-sm font-medium text-green-500 dark:text-gray-300">
                {new Date(emailVerifiedAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : (
              <Badge size="sm" color="error">
                Unverified
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      {/* <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Created at
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDate(createdAt)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Last modified at
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDate(updatedAt)}
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

