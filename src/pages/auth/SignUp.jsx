import { useEffect, useRef, useState } from "react";
import { UserRound, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

import { useSignupMutation } from "../../features/auth/authApi";
import {
  useGetPublicBusinessesQuery,
} from "../../features/businesses/businessesApi";
import {
  useGetPublicBusinessTypesByBusinessQuery,
} from "../../features/businessTypes/businessTypesApi";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  business: "",
  businessType: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [errors, setErrors] = useState({});

  const [signup, { isLoading: isSigningUp }] = useSignupMutation();

  // =====================================================
  // PUBLIC BUSINESSES
  // GET /api/business/public
  // =====================================================

  const {
    data: businesses = [],
    isLoading: isLoadingBusinesses,
    isError: isBusinessError,
  } = useGetPublicBusinessesQuery();

  // =====================================================
  // PUBLIC BUSINESS TYPES
  // GET /api/business-type/public/business/:businessId
  // =====================================================

  const {
    data: businessTypes = [],
    isLoading: isLoadingBusinessTypes,
    isFetching: isFetchingBusinessTypes,
    isError: isBusinessTypeError,
  } = useGetPublicBusinessTypesByBusinessQuery(form.business, {
    skip: !form.business,
  });

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  useEffect(() => {
    if (isBusinessError) {
      toast.error("Unable to load businesses");
    }
  }, [isBusinessError]);

  useEffect(() => {
    if (isBusinessTypeError) {
      toast.error("Unable to load business types");
    }
  }, [isBusinessTypeError]);

  // =====================================================
  // OPTIONS
  // =====================================================

  const businessOptions = businesses
    .filter((business) => business.isActive !== false)
    .map((business) => ({
      value: business._id,
      label: business.name,
    }));

  const businessTypeOptions = businessTypes
    .filter((businessType) => businessType.isActive !== false)
    .map((businessType) => ({
      value: businessType._id,
      label: businessType.name,
    }));

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "business") {
        return {
          ...prev,
          business: value,
          businessType: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "business" ? { businessType: "" } : {}),
    }));
  };

  // =====================================================
  // AVATAR
  // =====================================================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be less than 5MB");
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatar(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatar(null);
    setAvatarPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (form.phone.trim().length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.business) {
      newErrors.business = "Please select a business";
    }

    if (!form.businessType) {
      newErrors.businessType = "Please select a business type";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("phone", form.phone.trim());
      formData.append("password", form.password);
      formData.append("business", form.business);
      formData.append("businessType", form.businessType);

      if (avatar) {
        formData.append("avatar", avatar);
      }

      const response = await signup(formData).unwrap();

      toast.success(
        response?.message ||
          "Signup successful. Your account is pending approval."
      );

      navigate("/login");
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Signup failed. Please try again.";

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-primary rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-primary">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center">
                <UserRound className="w-5 h-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-primary">
                  Create Account
                </h1>

                <p className="text-sm text-secondary mt-1">
                  Register your Admin account and select your business.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Profile Picture
                <span className="text-secondary font-normal">
                  {" "}
                  (Optional)
                </span>
              </label>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border border-primary bg-surface overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="w-8 h-8 text-secondary" />
                    )}
                  </div>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>

                  <p className="text-xs text-secondary mt-2">
                    JPG, PNG or WEBP. Maximum 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-base font-semibold text-primary mb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  error={errors.name}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  error={errors.email}
                  required
                />

                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="03XX XXXXXXX"
                  error={errors.phone}
                  required
                />

                <PasswordInput
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  error={errors.password}
                  required
                />
              </div>
            </div>

            {/* Account & Business */}
            <div>
              <h2 className="text-base font-semibold text-primary mb-4">
                Account & Business
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Role
                  </label>

                  <div className="w-full min-h-11 px-3 flex items-center rounded-lg border border-primary bg-surface text-primary text-sm">
                    Admin
                  </div>

                  <p className="text-xs text-secondary mt-1.5">
                    Public registrations are created as Admin accounts.
                  </p>
                </div>

                {/* Business */}
                <Select
                  label="Business"
                  name="business"
                  value={form.business}
                  onChange={handleChange}
                  options={businessOptions}
                  placeholder={
                    isLoadingBusinesses
                      ? "Loading businesses..."
                      : "Select business"
                  }
                  disabled={isLoadingBusinesses || isSigningUp}
                  error={errors.business}
                  required
                />

                {/* Business Type */}
                <div className="md:col-span-2">
                  <Select
                    label="Business Type"
                    name="businessType"
                    value={form.businessType}
                    onChange={handleChange}
                    options={businessTypeOptions}
                    placeholder={
                      !form.business
                        ? "Select business first"
                        : isLoadingBusinessTypes ||
                          isFetchingBusinessTypes
                        ? "Loading business types..."
                        : businessTypeOptions.length === 0
                        ? "No business types available"
                        : "Select business type"
                    }
                    disabled={
                      !form.business ||
                      isLoadingBusinessTypes ||
                      isFetchingBusinessTypes ||
                      isSigningUp
                    }
                    error={errors.businessType}
                    required
                  />

                  {form.business &&
                    businessTypeOptions.length > 0 && (
                      <p className="text-xs text-secondary mt-1.5">
                        Only business types belonging to the selected
                        business are shown.
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="rounded-xl border border-primary bg-surface px-4 py-3">
              <p className="text-sm text-secondary leading-6">
                Your account will be registered with the{" "}
                <strong>Admin</strong> role. The account will remain{" "}
                <strong>pending</strong> until it is approved.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                className="w-full"
                disabled={isSigningUp}
              >
                {isSigningUp
                  ? "Creating Account..."
                  : "Create Account"}
              </Button>
            </div>

            {/* Login */}
            <div className="text-center">
              <p className="text-sm text-secondary">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-brand font-medium hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;