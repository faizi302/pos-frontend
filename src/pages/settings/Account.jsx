import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Upload,
  X,
  Image as ImageIcon,
  Lock,
  MapPin,
  Building2,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import PageHeader from "@/components/common/PageHeader";

import { usePermissions } from "@/hooks/usePermissions";
import {
  useUpdateMyProfileMutation,
  useRemoveMyAvatarMutation,
} from "@/features/auth/authApi";
import { setCurrentUser } from "@/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { getApiErrorMessage } from "@/utils/apiError";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function Account() {
  const { user } = usePermissions();
  const dispatch = useDispatch();

  const [updateMyProfile, { isLoading }] = useUpdateMyProfileMutation();
  const [removeMyAvatar, { isLoading: isRemovingAvatar }] =
    useRemoveMyAvatarMutation();

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // =====================================================
  // PROFILE FORM
  // =====================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // =====================================================
  // PASSWORD FORM (step-based)
  // =====================================================

  const [passwordStep, setPasswordStep] = useState(0); // 0 = closed, 1 = current, 2 = new
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // =====================================================
  // SYNC USER DATA
  // =====================================================

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      country: user.country || "",
      city: user.city || "",
      address: user.address || "",
    });

    setAvatarPreview(user.avatar?.url || "");
    setLogoPreview(user.logo?.url || "");
  }, [user]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ---------- Avatar ----------
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be less than 5MB");
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatarPreview = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(user?.avatar?.url || "");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // ---------- Logo ----------
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image for logo");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Business logo must be less than 5MB");
      return;
    }

    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogoPreview = () => {
    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(user?.logo?.url || "");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // =====================================================
  // SUBMIT PROFILE
  // =====================================================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      if (form.phone.trim()) formData.append("phone", form.phone.trim());
      if (form.country.trim()) formData.append("country", form.country.trim());
      if (form.city.trim()) formData.append("city", form.city.trim());
      if (form.address.trim()) formData.append("address", form.address.trim());

      // Email is usually not allowed to change freely — send only if backend supports it
      // formData.append("email", form.email.trim().toLowerCase());

      if (avatarFile) formData.append("avatar", avatarFile);
      if (logoFile) formData.append("logo", logoFile);

      const updatedUser = await updateMyProfile(formData).unwrap();

      dispatch(setCurrentUser(updatedUser));
      setAvatarFile(null);
      setLogoFile(null);

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // =====================================================
  // REMOVE AVATAR (server)
  // =====================================================

  const handleRemoveAvatarFromServer = async () => {
    try {
      const updatedUser = await removeMyAvatar().unwrap();
      dispatch(setCurrentUser(updatedUser));
      setAvatarFile(null);
      setAvatarPreview("");
      toast.success("Profile picture removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // =====================================================
  // PASSWORD FLOW
  // =====================================================

  const openPasswordChange = () => {
    setPasswordStep(1);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
  };

  const cancelPasswordChange = () => {
    setPasswordStep(0);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
  };

  const goToNewPasswordStep = () => {
    if (!passwordForm.currentPassword) {
      setPasswordErrors({ currentPassword: "Current password is required" });
      toast.error("Current password is required");
      return;
    }
    setPasswordStep(2);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      const first = Object.values(errors)[0];
      toast.error(first);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("currentPassword", passwordForm.currentPassword);
      formData.append("password", passwordForm.newPassword);
      formData.append("confirmPassword", passwordForm.confirmPassword);

      const updatedUser = await updateMyProfile(formData).unwrap();

      dispatch(setCurrentUser(updatedUser));
      cancelPasswordChange();
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-secondary">
        Loading account...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Account"
        description="Manage your profile, address, logo and security settings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* =====================================================
            LEFT SIDE – SUMMARY
        ===================================================== */}

        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={avatarPreview || user?.avatar?.url}
              name={user?.name}
              size="lg"
            />

            <p className="mt-3 font-semibold text-primary">{user?.name}</p>
            <p className="text-sm text-secondary">{user?.email}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Badge tone="brand">{user?.role?.name || "—"}</Badge>
              <StatusBadge active={user?.status === "active"} />
            </div>
          </div>

          {/* Business Logo Preview */}
          {(logoPreview || user?.logo?.url) && (
            <div className="mt-5 flex flex-col items-center">
              <p className="mb-2 text-xs font-medium text-secondary">
                Business Logo
              </p>
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-primary">
                <img
                  src={logoPreview || user?.logo?.url}
                  alt="Business logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2.5 border-t border-secondary pt-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-secondary">Business</span>
              <span className="text-right text-primary">
                {user?.business?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-secondary">Business Type</span>
              <span className="text-right text-primary">
                {user?.businessType?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-secondary">Email Verified</span>
              <span className="text-primary">
                {user?.isEmailVerified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-secondary">Last Login</span>
              <span className="text-right text-primary">
                {formatDate(user?.lastLoginAt)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-secondary">Member Since</span>
              <span className="text-right text-primary">
                {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </Card>

        {/* =====================================================
            RIGHT SIDE – FORMS
        ===================================================== */}

        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* ---------- Profile & Address ---------- */}
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" />
              <h2 className="text-sm font-semibold text-primary">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">

              {/* Images */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                {/* Avatar Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-primary">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-primary bg-surface">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-secondary" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Change
                      </Button>
                      {(avatarFile || user?.avatar?.url) && (
                        <button
                          type="button"
                          onClick={
                            avatarFile
                              ? handleRemoveAvatarPreview
                              : handleRemoveAvatarFromServer
                          }
                          className="text-left text-xs text-red-500 hover:underline"
                          disabled={isRemovingAvatar}
                        >
                          {isRemovingAvatar ? "Removing..." : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-primary">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-primary bg-surface">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-secondary" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Change
                      </Button>
                      {logoFile && (
                        <button
                          type="button"
                          onClick={handleRemoveLogoPreview}
                          className="text-left text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  value={form.email}
                  disabled
                  hint="Contact Super Admin to change email."
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="03XX XXXXXXX"
                />
              </div>

              {/* Address */}
              <div className="border-t border-secondary pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <h3 className="text-sm font-semibold text-primary">
                    Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="e.g. Pakistan"
                  />
                  <Input
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Lahore"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* ---------- Security / Password ---------- */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-secondary" />
                <h2 className="text-sm font-semibold text-primary">
                  Security
                </h2>
              </div>

              {passwordStep === 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openPasswordChange}
                >
                  Change Password
                </Button>
              )}
            </div>

            {passwordStep === 0 && (
              <p className="text-sm text-secondary">
                Keep your account secure. We recommend updating your password
                regularly.
              </p>
            )}

            {/* Step 1 – Current Password */}
            {passwordStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-secondary">
                  Enter your current password to continue.
                </p>

                <PasswordInput
                  label="Current Password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                  required
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelPasswordChange}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={goToNewPasswordStep}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 – New Password */}
            {passwordStep === 2 && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <p className="text-sm text-secondary">
                  Enter your new password.
                </p>

                <PasswordInput
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                  required
                />

                <PasswordInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmPassword}
                  required
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelPasswordChange}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isLoading}>
                    Update Password
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}