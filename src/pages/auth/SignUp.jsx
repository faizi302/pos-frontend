import { useEffect, useRef, useState } from "react";

import { UserRound, Upload, X, Image as ImageIcon } from "lucide-react";

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
  confirmPassword: "",
  country: "",
  city: "",
  address: "",
  business: "",
  businessType: "",
};


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const Signup = () => {
  const navigate = useNavigate();

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [errors, setErrors] = useState({});

  const [signup, { isLoading: isSigningUp }] = useSignupMutation();


  // =====================================================
  // PUBLIC BUSINESSES
  // =====================================================

  const {
    data: businesses = [],
    isLoading: isLoadingBusinesses,
    isError: isBusinessError,
  } = useGetPublicBusinessesQuery();


  // =====================================================
  // PUBLIC BUSINESS TYPES
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
      ...(name === "password" || name === "confirmPassword"
        ? { confirmPassword: "" }
        : {}),
    }));
  };


  // =====================================================
  // AVATAR
  // =====================================================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image for profile picture");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be less than 5MB");
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };


  const handleRemoveAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatar(null);
    setAvatarPreview("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };


  // =====================================================
  // LOGO (Business Logo)
  // =====================================================

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image for business logo");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Business logo must be less than 5MB");
      return;
    }

    if (logoPreview) URL.revokeObjectURL(logoPreview);

    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };


  const handleRemoveLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(null);
    setLogoPreview("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };


  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    // Name (required)
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email (required)
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email";
    }

    // Phone (optional – only validate format if provided)
    if (form.phone.trim() && form.phone.trim().length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Password (required)
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password (required)
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Country / City / Address – optional (no required check)

    setErrors(newErrors);

    // Show the first error in toast
    const firstError = Object.values(newErrors)[0];
    if (firstError) {
      toast.error(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);

      if (form.phone.trim()) {
        formData.append("phone", form.phone.trim());
      }

      if (form.country.trim()) {
        formData.append("country", form.country.trim());
      }

      if (form.city.trim()) {
        formData.append("city", form.city.trim());
      }

      if (form.address.trim()) {
        formData.append("address", form.address.trim());
      }

      if (form.business) {
        formData.append("business", form.business);
      }

      if (form.businessType) {
        formData.append("businessType", form.businessType);
      }

      if (avatar) {
        formData.append("avatar", avatar);
      }

      if (logo) {
        formData.append("logo", logo);
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
    <div className="w-full min-h-screen bg-surface flex items-center justify-center">

      <div className="w-full">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="w-full pb-5 border-b border-primary">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-brand flex items-center justify-center">
              <UserRound className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-primary">
                Create Account
              </h1>
              <p className="text-sm text-secondary mt-1">
                Register your Admin account and select your business.
              </p>
            </div>
          </div>
        </div>


        {/* =====================================================
            SCROLLABLE FORM
        ===================================================== */}

        <div className="w-full max-h-[calc(100vh-150px)] overflow-y-auto">

          <form
            onSubmit={handleSubmit}
            className="w-full space-y-6 pt-6"
            noValidate
          >

            {/* =====================================================
                PROFILE PICTURE + BUSINESS LOGO
            ===================================================== */}

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Avatar */}
              <div className="w-full">
                <label className="block text-sm font-medium text-primary mb-3">
                  Profile Picture{" "}
                  <span className="text-secondary font-normal">(Optional)</span>
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
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
                        aria-label="Remove profile picture"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>

                    <p className="text-xs text-secondary mt-2">
                      JPG, PNG or WEBP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>


              {/* Logo */}
              <div className="w-full">
                <label className="block text-sm font-medium text-primary mb-3">
                  Business Logo{" "}
                  <span className="text-secondary font-normal">(Optional)</span>
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-xl border border-primary bg-surface overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-secondary" />
                      )}
                    </div>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                        aria-label="Remove business logo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>

                    <p className="text-xs text-secondary mt-2">
                      Recommended square. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

            </div>


            {/* =====================================================
                PERSONAL INFORMATION
            ===================================================== */}

            <div className="w-full">
              <h2 className="text-base font-semibold text-primary mb-4">
                Personal Information
              </h2>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

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

                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  error={errors.confirmPassword}
                  required
                />

              </div>
            </div>


            {/* =====================================================
                ADDRESS INFORMATION
            ===================================================== */}

            <div className="w-full">
              <h2 className="text-base font-semibold text-primary mb-4">
                Address Information{" "}
                <span className="text-secondary font-normal text-sm">
                  (Optional)
                </span>
              </h2>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                <Input
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="e.g. Pakistan"
                  error={errors.country}
                />

                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Lahore"
                  error={errors.city}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    error={errors.address}
                  />
                </div>

              </div>
            </div>


            {/* =====================================================
                ACCOUNT & BUSINESS
            ===================================================== */}

            <div className="w-full">
              <h2 className="text-base font-semibold text-primary mb-4">
                Account & Business
              </h2>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Role (read-only) */}
                <div className="w-full">
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

                {/* Business (optional) */}
                <div className="w-full">
                  <Select
                    label="Business"
                    name="business"
                    value={form.business}
                    onChange={handleChange}
                    options={businessOptions}
                    placeholder={
                      isLoadingBusinesses
                        ? "Loading businesses..."
                        : "Select business (optional)"
                    }
                    disabled={isLoadingBusinesses || isSigningUp}
                    error={errors.business}
                  />
                </div>

                {/* Business Type (optional) */}
                <div className="w-full md:col-span-2">
                  <Select
                    label="Business Type"
                    name="businessType"
                    value={form.businessType}
                    onChange={handleChange}
                    options={businessTypeOptions}
                    placeholder={
                      !form.business
                        ? "Select business first"
                        : isLoadingBusinessTypes || isFetchingBusinessTypes
                        ? "Loading business types..."
                        : businessTypeOptions.length === 0
                        ? "No business types available"
                        : "Select business type (optional)"
                    }
                    disabled={
                      !form.business ||
                      isLoadingBusinessTypes ||
                      isFetchingBusinessTypes ||
                      isSigningUp
                    }
                    error={errors.businessType}
                  />

                  {form.business && businessTypeOptions.length > 0 && (
                    <p className="text-xs text-secondary mt-1.5">
                      Only business types belonging to the selected business
                      are shown.
                    </p>
                  )}
                </div>

              </div>
            </div>


            {/* =====================================================
                ACCOUNT INFO NOTE
            ===================================================== */}

            <div className="w-full rounded-xl border border-primary bg-surface px-4 py-3">
              <p className="text-sm text-secondary leading-6">
                Your account will be registered with the{" "}
                <strong>Admin</strong> role. The account will remain{" "}
                <strong>pending</strong> until it is approved by Super Admin.
              </p>
            </div>


            {/* =====================================================
                SUBMIT
            ===================================================== */}

            <div className="w-full pt-1">
              <Button
                type="submit"
                className="w-full"
                disabled={isSigningUp}
              >
                {isSigningUp ? "Creating Account..." : "Create Account"}
              </Button>
            </div>


            {/* =====================================================
                LOGIN LINK
            ===================================================== */}

            <div className="w-full text-center pb-1">
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