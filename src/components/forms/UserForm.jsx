
import { useEffect, useRef, useState } from "react";
import { UserRound, Upload, X } from "lucide-react";

import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function UserForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}) {
  const isEditing = Boolean(initialValues);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Image state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        email: initialValues.email || "",
        phone: initialValues.phone || "",
        password: "",
        status: initialValues.status || "active",
      });

      setAvatarFile(null);
      setAvatarPreview(initialValues.avatar?.url || null);
    } else {
      setForm(emptyForm);
      setAvatarFile(null);
      setAvatarPreview(null);
    }

    setErrors({});
  }, [initialValues]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error while typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    // Basic frontend validation
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Only JPG, PNG and WebP images are allowed",
      }));

      e.target.value = "";
      return;
    }

    // 5 MB frontend limit
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Image size must be less than 5MB",
      }));

      e.target.value = "";
      return;
    }

    setAvatarFile(file);

    // Revoke previous blob preview
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setErrors((prev) => ({
      ...prev,
      avatar: "",
    }));
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validate() {
    const next = {};

    if (!form.name.trim()) {
      next.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      next.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      next.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(form.email.trim())) {
        next.email = "Please enter a valid email address";
      }
    }

    if (!isEditing && (!form.password || form.password.length < 6)) {
      next.password = "Password must be at least 6 characters";
    }

    if (isEditing && form.password && form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    /*
     * Use FormData because the manager can have an avatar image.
     *
     * Important:
     * We intentionally DO NOT send:
     * - role
     * - business
     * - businessType
     * - createdBy
     * - isEmailVerified
     *
     * The backend controls these values.
     */

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim().toLowerCase());

    if (form.phone.trim()) {
      formData.append("phone", form.phone.trim());
    }

    if (!isEditing || form.password.trim()) {
      if (form.password.trim()) {
        formData.append("password", form.password);
      }
    }

    formData.append("status", form.status);

    // Only send avatar when a new image was selected
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* Avatar */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-primary">
          Profile Image
        </label>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {/* Preview */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-primary bg-card">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Manager preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10 text-secondary" />
              )}
            </div>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={submitting}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-primary transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove profile image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Upload */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              <Upload className="mr-2 h-4 w-4" />
              {avatarPreview ? "Change Image" : "Upload Image"}
            </Button>

            <p className="text-xs text-secondary">
              JPG, PNG or WebP. Maximum size 5MB.
            </p>

            {errors.avatar && (
              <p className="text-xs text-red-500">{errors.avatar}</p>
            )}
          </div>
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          value={form.name}
          error={errors.name}
          placeholder="Enter manager name"
          autoComplete="name"
          disabled={submitting}
          onChange={handleChange}
        />

        <Input
          name="email"
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          placeholder="manager@example.com"
          autoComplete="email"
          disabled={submitting}
          onChange={handleChange}
        />
      </div>

      {/* Phone + Password */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="phone"
          label="Phone"
          value={form.phone}
          placeholder="03XX XXXXXXX"
          autoComplete="tel"
          disabled={submitting}
          onChange={handleChange}
        />

        <PasswordInput
          name="password"
          label={isEditing ? "New Password (optional)" : "Password"}
          value={form.password}
          error={errors.password}
          placeholder={
            isEditing ? "Enter new password" : "Enter password"
          }
          autoComplete={isEditing ? "new-password" : "new-password"}
          disabled={submitting}
          onChange={handleChange}
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary">
          Role
        </label>

        <div className="flex h-10 w-full items-center rounded-lg border border-primary bg-card px-3 text-sm text-primary">
          Manager
        </div>

        <p className="text-xs text-secondary">
          The manager role is automatically assigned by the system.
        </p>
      </div>

      {/* Status */}
      <Select
        name="status"
        label="Status"
        options={statusOptions}
        value={form.status}
        disabled={submitting}
        onChange={handleChange}
      />

      {/* Info */}
      <div className="rounded-lg border border-primary bg-card/50 p-3">
        <p className="text-xs leading-5 text-secondary">
          This manager will automatically belong to your account through
          the <span className="font-medium text-primary">createdBy</span>{" "}
          relationship. Business and Business Type are inherited from the
          Admin account and are not required for the Manager.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-1 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" loading={submitting}>
          {isEditing ? "Save changes" : "Create Manager"}
        </Button>
      </div>
    </form>
  );
}
