import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  Upload,
  Loader2,
  ShieldCheck,
  X,
  Pencil,
} from "lucide-react";

import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/features/users/usersApi";

// =====================================================
// EDIT ADMIN
// =====================================================
//
// SUPER ADMIN ONLY.
//
// Route:
// /users/:id/edit
//
// Editable here:
// - name
// - email
// - phone
// - avatar
// - password (optional)
// - email verification
//
// NOT editable here:
// - role            (fixed — always Admin)
// - status          (managed from Users.jsx / UserDetails.jsx
//                     approve/pending/reject/block actions)
// - business / businessType
//     Not wired up yet — this project's business/business-type
//     select data source (API hooks) wasn't available when this
//     page was generated. The backend (updateUser controller)
//     already supports changing them; add a Select bound to your
//     business/businessType list endpoints here if needed.
// =====================================================

export default function EditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =====================================================
  // API
  // =====================================================

  const {
    data: admin,
    isLoading: loadingAdmin,
    isError: adminLoadError,
  } = useGetUserByIdQuery(id, {
    skip: !id,
  });

  const [updateUser, { isLoading: updating }] =
    useUpdateUserMutation();

  const isLoading = updating || loadingAdmin;

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    avatar: null,
    isEmailVerified: false,
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // =====================================================
  // LOAD ADMIN
  // =====================================================

  useEffect(() => {
    if (!admin) return;

    setForm({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      confirmPassword: "",
      avatar: null,
      isEmailVerified: Boolean(admin.isEmailVerified),
    });

    setAvatarPreview(admin.avatar?.url || null);
    setRemoveAvatar(false);
    setErrors({});
  }, [admin]);

  // =====================================================
  // HANDLE LOAD ERROR
  // =====================================================

  useEffect(() => {
    if (adminLoadError) {
      toast.error("Unable to load admin details");
      navigate("/users", { replace: true });
    }
  }, [adminLoadError, navigate]);

  // =====================================================
  // CLEANUP OBJECT URL
  // =====================================================

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => navigate(`/users/${id}`);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleEmailVerifiedChange = (e) => {
    setForm((prev) => ({
      ...prev,
      isEmailVerified: e.target.checked,
    }));
  };

  // =====================================================
  // AVATAR CHANGE
  // =====================================================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Please select a valid image.",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Image size cannot exceed 5MB.",
      }));
      e.target.value = "";
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      avatar: file,
    }));

    setAvatarPreview(previewUrl);
    setRemoveAvatar(false);

    setErrors((prev) => ({
      ...prev,
      avatar: "",
    }));

    e.target.value = "";
  };

  // =====================================================
  // REMOVE AVATAR
  // =====================================================

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(null);

    setForm((prev) => ({
      ...prev,
      avatar: null,
    }));

    setRemoveAvatar(true);

    setErrors((prev) => ({
      ...prev,
      avatar: "",
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = () => {
    const newErrors = {};

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please provide a valid email";
    }

    if (phone.length > 30) {
      newErrors.phone = "Phone number cannot exceed 30 characters";
    }

    // Password is optional on edit.
    if (form.password && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (form.password && form.password.length > 100) {
      newErrors.password = "Password cannot exceed 100 characters";
    }

    if (form.password || form.confirmPassword) {
      if (!form.password) {
        newErrors.password =
          "Password is required when changing password";
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = "Please confirm the new password";
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (form.avatar) {
      if (!form.avatar.type.startsWith("image/")) {
        newErrors.avatar = "Please select a valid image";
      } else if (form.avatar.size > 5 * 1024 * 1024) {
        newErrors.avatar = "Image size cannot exceed 5MB";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("phone", form.phone.trim());
      formData.append(
        "isEmailVerified",
        form.isEmailVerified ? "true" : "false"
      );

      if (form.password) {
        formData.append("password", form.password);
      }

      if (form.avatar) {
        formData.append("avatar", form.avatar);
      }

      if (removeAvatar) {
        formData.append("removeAvatar", "true");
      }

      const response = await updateUser({
        id,
        body: formData,
      }).unwrap();

      toast.success(
        response?.message || "Admin updated successfully"
      );

      navigate(`/users/${id}`, { replace: true });
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        "Unable to update admin";

      toast.error(message);
    }
  };

  // =====================================================
  // INPUT CLASS
  // =====================================================

  const inputClass = (field) =>
    `w-full rounded-xl border bg-background px-4 py-3 pl-11 text-sm outline-none transition ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
    }`;

  // =====================================================
  // LOADING
  // =====================================================

  if (loadingAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading admin...
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={isLoading}
          className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Pencil className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Edit Admin
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Update this administrator&apos;s account information.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          FORM CARD
      ================================================= */}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="p-5 sm:p-8">
          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <div className="mb-8">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Admin Information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the admin&apos;s basic account information.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter admin name"
                    autoComplete="name"
                    className={inputClass("name")}
                    disabled={isLoading}
                  />
                </div>

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className={inputClass("email")}
                    disabled={isLoading}
                  />
                </div>

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phone
                </label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03XX XXXXXXX"
                    autoComplete="tel"
                    className={inputClass("phone")}
                    disabled={isLoading}
                  />
                </div>

                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* EMAIL VERIFIED */}

              <div className="flex items-end pb-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isEmailVerified}
                    onChange={handleEmailVerifiedChange}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-border"
                  />
                  Mark email as verified
                </label>
              </div>

              {/* AVATAR */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Profile Picture
                </label>

                <div
                  className={`rounded-xl border border-dashed p-4 transition ${
                    errors.avatar ? "border-red-500" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Admin preview"
                          className="h-16 w-16 rounded-2xl object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                          <User className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {form.avatar
                          ? form.avatar.name
                          : avatarPreview
                            ? "Current profile picture"
                            : "No profile picture"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WEBP • Maximum 5MB
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted">
                          <Upload className="h-3.5 w-3.5" />
                          {avatarPreview ? "Change Image" : "Choose Image"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleAvatarChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>

                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {errors.avatar && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.avatar}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              SECURITY
          ================================================= */}

          <div className="border-t border-border pt-8">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Account Security
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leave the password fields empty if you do not want to
                change the password.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  New Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave empty to keep current password"
                    autoComplete="new-password"
                    className={`${inputClass("password")} pr-11`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm New Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={`${inputClass("confirmPassword")} pr-11`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              ROLE / STATUS INFO
          ================================================= */}

          <div className="mt-8 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="mt-0.5 shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Role &amp; Status
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Role cannot be changed from this form. To approve,
                reject, block, or reset this admin to pending, use the
                status actions on the admin&apos;s details page.
              </p>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}