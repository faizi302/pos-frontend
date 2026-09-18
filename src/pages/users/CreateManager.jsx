import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  Upload,
  UserPlus,
  Loader2,
  ShieldCheck,
  X,
  Pencil,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  useCreateManagerMutation,
  useGetManagerByIdQuery,
  useUpdateManagerMutation,
} from "@/features/users/managerApi";

export default function CreateManager() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =====================================================
  // MODE
  // =====================================================

  const isEditMode = Boolean(id);

  // =====================================================
  // API
  // =====================================================

  const [createManager, { isLoading: creating }] =
    useCreateManagerMutation();

  const [updateManager, { isLoading: updating }] =
    useUpdateManagerMutation();

  const {
    data: manager,
    isLoading: loadingManager,
    isError: managerLoadError,
  } = useGetManagerByIdQuery(id, {
    skip: !isEditMode,
  });

  const isLoading =
    creating || updating || loadingManager;

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
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [avatarPreview, setAvatarPreview] =
    useState(null);

  const [removeAvatar, setRemoveAvatar] =
    useState(false);

  // =====================================================
  // LOAD MANAGER FOR EDIT
  // =====================================================

  useEffect(() => {
    if (!isEditMode || !manager) return;

    setForm({
      name: manager.name || "",
      email: manager.email || "",
      phone: manager.phone || "",
      password: "",
      confirmPassword: "",
      avatar: null,
    });

    setAvatarPreview(manager.avatar?.url || null);
    setRemoveAvatar(false);
    setErrors({});
  }, [isEditMode, manager]);

  // =====================================================
  // HANDLE LOAD ERROR
  // =====================================================

  useEffect(() => {
    if (isEditMode && managerLoadError) {
      toast.error("Unable to load manager details");
      navigate("/users", { replace: true });
    }
  }, [
    isEditMode,
    managerLoadError,
    navigate,
  ]);

  // =====================================================
  // CLEANUP OBJECT URL
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        avatarPreview &&
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // =====================================================
  // BACK TO USERS
  // =====================================================

  const handleBack = () => {
    navigate("/users");
  };

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

  // =====================================================
  // AVATAR CHANGE
  // =====================================================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Please select a valid image.",
      }));

      e.target.value = "";
      return;
    }

    // Validate image size
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Image size cannot exceed 5MB.",
      }));

      e.target.value = "";
      return;
    }

    // Revoke previous preview if it was a blob
    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      avatar: file,
    }));

    setAvatarPreview(previewUrl);

    // New image means don't remove avatar
    setRemoveAvatar(false);

    setErrors((prev) => ({
      ...prev,
      avatar: "",
    }));

    // Allow selecting the same file again
    e.target.value = "";
  };

  // =====================================================
  // REMOVE AVATAR
  // =====================================================

  const handleRemoveAvatar = () => {
    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(null);

    setForm((prev) => ({
      ...prev,
      avatar: null,
    }));

    if (isEditMode) {
      setRemoveAvatar(true);
    }

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

    // ---------------------------------------------------
    // NAME
    // ---------------------------------------------------

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name =
        "Name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name =
        "Name cannot exceed 100 characters";
    }

    // ---------------------------------------------------
    // EMAIL
    // ---------------------------------------------------

    if (!email) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email =
        "Please provide a valid email";
    }

    // ---------------------------------------------------
    // PHONE
    // ---------------------------------------------------

    if (phone.length > 30) {
      newErrors.phone =
        "Phone number cannot exceed 30 characters";
    }

    // ---------------------------------------------------
    // PASSWORD
    // ---------------------------------------------------

    if (!isEditMode) {
      // Required during creation

      if (!form.password) {
        newErrors.password =
          "Password is required";
      } else if (form.password.length < 6) {
        newErrors.password =
          "Password must be at least 6 characters";
      } else if (form.password.length > 100) {
        newErrors.password =
          "Password cannot exceed 100 characters";
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword =
          "Confirm password is required";
      } else if (
        form.password !== form.confirmPassword
      ) {
        newErrors.confirmPassword =
          "Passwords do not match";
      }
    } else {
      // Optional during update

      if (
        form.password &&
        form.password.length < 6
      ) {
        newErrors.password =
          "Password must be at least 6 characters";
      } else if (
        form.password &&
        form.password.length > 100
      ) {
        newErrors.password =
          "Password cannot exceed 100 characters";
      }

      if (
        form.password ||
        form.confirmPassword
      ) {
        if (!form.password) {
          newErrors.password =
            "Password is required when changing password";
        }

        if (!form.confirmPassword) {
          newErrors.confirmPassword =
            "Please confirm the new password";
        } else if (
          form.password !==
          form.confirmPassword
        ) {
          newErrors.confirmPassword =
            "Passwords do not match";
        }
      }
    }

    // ---------------------------------------------------
    // AVATAR
    // ---------------------------------------------------

    if (form.avatar) {
      if (!form.avatar.type.startsWith("image/")) {
        newErrors.avatar =
          "Please select a valid image";
      } else if (
        form.avatar.size > 5 * 1024 * 1024
      ) {
        newErrors.avatar =
          "Image size cannot exceed 5MB";
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
      toast.error(
        "Please fix the highlighted fields"
      );
      return;
    }

    try {
      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "email",
        form.email.trim().toLowerCase()
      );

      if (form.phone.trim()) {
        formData.append(
          "phone",
          form.phone.trim()
        );
      } else {
        // Send empty phone during update
        formData.append("phone", "");
      }

      // ---------------------------------------------------
      // PASSWORD
      // ---------------------------------------------------

      if (form.password) {
        formData.append(
          "password",
          form.password
        );
      }

      // ---------------------------------------------------
      // AVATAR
      // ---------------------------------------------------

      if (form.avatar) {
        formData.append(
          "avatar",
          form.avatar
        );
      }

      // ---------------------------------------------------
      // REMOVE AVATAR
      // ---------------------------------------------------

      if (isEditMode && removeAvatar) {
        formData.append(
          "removeAvatar",
          "true"
        );
      }

      // ---------------------------------------------------
      // CREATE
      // ---------------------------------------------------

      if (!isEditMode) {
        const response =
          await createManager(
            formData
          ).unwrap();

        toast.success(
          response?.message ||
            "Manager created successfully"
        );

        // IMPORTANT:
        // Your actual Users page is /users
        navigate("/users", {
          replace: true,
        });

        return;
      }

      // ---------------------------------------------------
      // UPDATE
      // ---------------------------------------------------

      const response =
        await updateManager({
          id,
          body: formData,
        }).unwrap();

      toast.success(
        response?.message ||
          "Manager updated successfully"
      );

      // IMPORTANT:
      // Return to actual Users page
      navigate("/users", {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        (isEditMode
          ? "Unable to update manager"
          : "Unable to create manager");

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
  // LOADING EDIT DATA
  // =====================================================

  if (isEditMode && loadingManager) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading manager...
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
          Back to Users
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isEditMode ? (
              <Pencil className="h-7 w-7" />
            ) : (
              <UserPlus className="h-7 w-7" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isEditMode
                ? "Edit Manager"
                : "Create Manager"}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {isEditMode
                ? "Update the manager account information."
                : "Create a manager account for your business."}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          FORM CARD
          ================================================= */}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-8"
        >
          {/* =================================================
              BASIC INFORMATION
              ================================================= */}

          <div className="mb-8">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Manager Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {isEditMode
                  ? "Update the manager's basic account information."
                  : "Enter the basic information for the new manager."}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* =================================================
                  NAME
                  ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter manager name"
                    autoComplete="name"
                    className={inputClass(
                      "name"
                    )}
                    disabled={isLoading}
                  />
                </div>

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* =================================================
                  EMAIL
                  ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="manager@example.com"
                    autoComplete="email"
                    className={inputClass(
                      "email"
                    )}
                    disabled={isLoading}
                  />
                </div>

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* =================================================
                  PHONE
                  ================================================= */}

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
                    className={inputClass(
                      "phone"
                    )}
                    disabled={isLoading}
                  />
                </div>

                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* =================================================
                  AVATAR
                  ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Profile Picture
                </label>

                <div
                  className={`rounded-xl border border-dashed p-4 transition ${
                    errors.avatar
                      ? "border-red-500"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* PREVIEW */}

                    <div className="relative shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Manager preview"
                          className="h-16 w-16 rounded-2xl object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                          <User className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {form.avatar
                          ? form.avatar.name
                          : avatarPreview
                            ? "Current profile picture"
                            : "No profile picture"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WEBP • Maximum
                        5MB
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* CHANGE IMAGE */}

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted">
                          <Upload className="h-3.5 w-3.5" />

                          {avatarPreview
                            ? "Change Image"
                            : "Choose Image"}

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={
                              handleAvatarChange
                            }
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>

                        {/* REMOVE */}

                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={
                              handleRemoveAvatar
                            }
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
                {isEditMode
                  ? "Leave the password fields empty if you do not want to change the password."
                  : "Set a secure password for the manager account."}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* =================================================
                  PASSWORD
                  ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password{" "}
                  {!isEditMode && (
                    <span className="text-red-500">
                      *
                    </span>
                  )}
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      isEditMode
                        ? "Leave empty to keep current password"
                        : "Minimum 6 characters"
                    }
                    autoComplete="new-password"
                    className={`${inputClass(
                      "password"
                    )} pr-11`}
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
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

              {/* =================================================
                  CONFIRM PASSWORD
                  ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password{" "}
                  {!isEditMode && (
                    <span className="text-red-500">
                      *
                    </span>
                  )}
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      form.confirmPassword
                    }
                    onChange={handleChange}
                    placeholder={
                      isEditMode
                        ? "Confirm new password"
                        : "Re-enter password"
                    }
                    autoComplete="new-password"
                    className={`${inputClass(
                      "confirmPassword"
                    )} pr-11`}
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
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
                    {
                      errors.confirmPassword
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              AUTOMATIC ROLE INFO
              ================================================= */}

          <div className="mt-8 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="mt-0.5 shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Manager Role Assignment
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This account automatically uses the{" "}
                <span className="font-medium text-foreground">
                  Manager
                </span>{" "}
                role and remains linked to the
                Admin who created it. Role,
                business, business type, and owner
                cannot be changed from this form.
              </p>
            </div>
          </div>

          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            {/* BACK */}

            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </button>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  {isEditMode
                    ? "Updating Manager..."
                    : "Creating Manager..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update Manager
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Manager
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}