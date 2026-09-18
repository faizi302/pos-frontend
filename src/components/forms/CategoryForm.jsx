import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Image as ImageIcon,
  X,
  Upload,
} from "lucide-react";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

import { useSelector } from "react-redux";

import { useGetBusinessesQuery } from "../../features/businesses/businessesApi";
import { useGetBusinessTypesQuery } from "../../features/businessTypes/businessTypesApi";

export default function CategoryForm({
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  // =====================================================
  // USER / ROLE
  // =====================================================

  const user = useSelector(
    (state) => state.auth?.user
  );

  const role =
    user?.role?.slug ||
    user?.role?.name?.toLowerCase() ||
    "";

  const isSuperAdmin = role === "super-admin";

  // =====================================================
  // FORM STATE
  // =====================================================

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] =
    useState("");

  const [business, setBusiness] = useState("");
  const [businessType, setBusinessType] =
    useState("");

  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [removeImage, setRemoveImage] =
    useState(false);

  // =====================================================
  // GET BUSINESSES
  // =====================================================

  const {
    data: businessResponse,
    isLoading: businessesLoading,
  } = useGetBusinessesQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // =====================================================
  // NORMALIZE BUSINESSES
  // =====================================================

  const businesses = useMemo(() => {
    if (Array.isArray(businessResponse)) {
      return businessResponse;
    }

    if (
      Array.isArray(
        businessResponse?.businesses
      )
    ) {
      return businessResponse.businesses;
    }

    if (
      Array.isArray(
        businessResponse?.data
      )
    ) {
      return businessResponse.data;
    }

    return [];
  }, [businessResponse]);

  // =====================================================
  // GET BUSINESS TYPES
  // =====================================================

  /*
   * We fetch Business Types for Super Admin.
   *
   * The backend should already return Business Types
   * according to the logged-in user's permissions.
   *
   * If your BusinessType API supports a business query,
   * this can later be changed to:
   *
   * useGetBusinessTypesQuery(
   *   { business: business },
   *   { skip: !isSuperAdmin || !business }
   * )
   */

  const {
    data: businessTypeResponse,
    isLoading: businessTypesLoading,
  } = useGetBusinessTypesQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // =====================================================
  // NORMALIZE BUSINESS TYPES
  // =====================================================

  const allBusinessTypes = useMemo(() => {
    if (Array.isArray(businessTypeResponse)) {
      return businessTypeResponse;
    }

    if (
      Array.isArray(
        businessTypeResponse?.businessTypes
      )
    ) {
      return businessTypeResponse.businessTypes;
    }

    if (
      Array.isArray(
        businessTypeResponse?.data
      )
    ) {
      return businessTypeResponse.data;
    }

    return [];
  }, [businessTypeResponse]);

  // =====================================================
  // FILTER BUSINESS TYPES BY BUSINESS
  // =====================================================

  const businessTypes = useMemo(() => {
    if (!business) {
      return [];
    }

    return allBusinessTypes.filter(
      (item) => {
        const itemBusinessId =
          item?.business?._id ||
          item?.business ||
          "";

        return (
          String(itemBusinessId) ===
          String(business)
        );
      }
    );
  }, [
    allBusinessTypes,
    business,
  ]);

  // =====================================================
  // INITIAL VALUES
  // =====================================================

  useEffect(() => {
    if (!initialValues) {
      setName("");
      setSlug("");
      setDescription("");
      setBusiness("");
      setBusinessType("");
      setIsActive(true);
      setImageFile(null);
      setImagePreview("");
      setRemoveImage(false);

      return;
    }

    setName(initialValues?.name || "");

    setSlug(initialValues?.slug || "");

    setDescription(
      initialValues?.description || ""
    );

    const initialBusiness =
      initialValues?.business?._id ||
      initialValues?.business ||
      "";

    const initialBusinessType =
      initialValues?.businessType?._id ||
      initialValues?.businessType ||
      "";

    setBusiness(initialBusiness);
    setBusinessType(initialBusinessType);

    setIsActive(
      initialValues?.isActive !== false
    );

    setImageFile(null);

    setImagePreview(
      initialValues?.image?.url || ""
    );

    setRemoveImage(false);
  }, [initialValues]);

  // =====================================================
  // AUTO GENERATE SLUG
  // =====================================================

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(value) {
    setName(value);

    /*
     * Only automatically generate slug while creating.
     *
     * During edit, the existing slug is preserved unless
     * the user manually changes it.
     */

    if (!initialValues) {
      setSlug(createSlug(value));
    }
  }

  // =====================================================
  // BUSINESS CHANGE
  // =====================================================

  function handleBusinessChange(value) {
    setBusiness(value);

    /*
     * Business Type belongs to Business.
     *
     * Therefore whenever Business changes,
     * the previously selected Business Type becomes invalid.
     */

    setBusinessType("");
  }

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // -------------------------------------------------
    // FILE TYPE
    // -------------------------------------------------

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }

    // -------------------------------------------------
    // FILE SIZE
    // -------------------------------------------------

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(
        "Image size must be less than 5MB."
      );
      return;
    }

    // -------------------------------------------------
    // SET FILE
    // -------------------------------------------------

    setImageFile(file);
    setRemoveImage(false);

    // -------------------------------------------------
    // PREVIEW
    // -------------------------------------------------

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview("");

    /*
     * Existing image should be removed by backend.
     *
     * For a newly selected image there is no Cloudinary
     * image yet, but setting removeImage false/true is
     * harmless because backend can handle it.
     */

    if (initialValues?.image?.url) {
      setRemoveImage(true);
    } else {
      setRemoveImage(false);
    }
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    // -------------------------------------------------
    // NAME
    // -------------------------------------------------

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Category name is required.");
      return;
    }

    // -------------------------------------------------
    // SUPER ADMIN BUSINESS
    // -------------------------------------------------

    if (isSuperAdmin && !business) {
      toast.error("Please select a business.");
      return;
    }

    // -------------------------------------------------
    // SUPER ADMIN BUSINESS TYPE
    // -------------------------------------------------

    /*
     * Business Type is optional according to the backend
     * architecture.
     *
     * Therefore we do NOT force it here.
     */

    // -------------------------------------------------
    // FORM DATA
    // -------------------------------------------------

    const formData = new FormData();

    formData.append("name", trimmedName);

    if (slug.trim()) {
      formData.append(
        "slug",
        slug.trim().toLowerCase()
      );
    }

    if (description.trim()) {
      formData.append(
        "description",
        description.trim()
      );
    }

    formData.append(
      "isActive",
      String(isActive)
    );

    // -------------------------------------------------
    // SUPER ADMIN CONTEXT
    // -------------------------------------------------

    if (isSuperAdmin) {
      formData.append(
        "business",
        business
      );

      if (businessType) {
        formData.append(
          "businessType",
          businessType
        );
      } else {
        formData.append(
          "businessType",
          ""
        );
      }
    }

    // -------------------------------------------------
    // IMAGE
    // -------------------------------------------------

    if (imageFile) {
      formData.append(
        "image",
        imageFile
      );
    }

    // -------------------------------------------------
    // REMOVE IMAGE
    // -------------------------------------------------

    if (removeImage) {
      formData.append(
        "removeImage",
        "true"
      );
    }

    // -------------------------------------------------
    // SEND TO PARENT
    // -------------------------------------------------

    await onSubmit(formData);
  }

  // =====================================================
  // BUSINESS OPTIONS
  // =====================================================

  const businessOptions = [
    {
      value: "",
      label: "Select business",
    },

    ...businesses
      .filter(
        (item) => item?.isActive !== false
      )
      .map((item) => ({
        value: item?._id,
        label:
          item?.name || "Unnamed business",
      })),
  ];

  // =====================================================
  // BUSINESS TYPE OPTIONS
  // =====================================================

  const businessTypeOptions = [
    {
      value: "",
      label: business
        ? "Select business type"
        : "Select business first",
    },

    ...businessTypes
      .filter(
        (item) => item?.isActive !== false
      )
      .map((item) => ({
        value: item?._id,
        label:
          item?.name ||
          "Unnamed business type",
      })),
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* =================================================
          SUPER ADMIN BUSINESS
      ================================================= */}

      {isSuperAdmin && (
        <>
          <Select
            label="Business"
            required
            options={businessOptions}
            value={business}
            onChange={(e) =>
              handleBusinessChange(
                e.target.value
              )
            }
            disabled={
              businessesLoading ||
              submitting
            }
          />

          {/* =============================================
              BUSINESS TYPE
          ============================================= */}

          <Select
            label="Business Type"
            options={businessTypeOptions}
            value={businessType}
            onChange={(e) =>
              setBusinessType(
                e.target.value
              )
            }
            disabled={
              !business ||
              businessTypesLoading ||
              submitting
            }
          />
        </>
      )}

      {/* =================================================
          CATEGORY NAME
      ================================================= */}

      <Input
        label="Category Name"
        required
        value={name}
        onChange={(e) =>
          handleNameChange(
            e.target.value
          )
        }
        placeholder="e.g. Gaming Laptops"
        disabled={submitting}
      />

      {/* =================================================
          SLUG
      ================================================= */}

      <Input
        label="Slug"
        value={slug}
        onChange={(e) =>
          setSlug(e.target.value)
        }
        placeholder="gaming-laptops"
        disabled={submitting}
      />

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <Textarea
        label="Description"
        value={description}
        onChange={(e) =>
          setDescription(
            e.target.value
          )
        }
        placeholder="Enter category description..."
        rows={4}
        disabled={submitting}
      />

      {/* =================================================
          IMAGE
      ================================================= */}

      <div className="space-y-2">
        <label className="text-sm font-medium text-primary">
          Category Image
        </label>

        {imagePreview ? (
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt={
                name ||
                "Category preview"
              }
              className="h-32 w-32 rounded-xl border border-primary/10 object-cover"
            />

            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={submitting}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 bg-muted-action/30 px-6 py-8 transition hover:border-primary/40 ${
              submitting
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <Upload className="mb-2 h-6 w-6 text-secondary" />

            <span className="text-sm font-medium text-primary">
              Upload image
            </span>

            <span className="mt-1 text-xs text-secondary">
              PNG, JPG, WEBP — max 5MB
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="hidden"
              disabled={submitting}
            />
          </label>
        )}
      </div>

      {/* =================================================
          ACTIVE STATUS
      ================================================= */}

      <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-muted-action/20 p-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Active Category
          </p>

          <p className="text-xs text-secondary">
            Inactive categories will not be
            available for normal selection.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          disabled={submitting}
          onClick={() =>
            setIsActive(
              (current) => !current
            )
          }
          className={`relative h-6 w-11 rounded-full transition ${
            isActive
              ? "bg-primary"
              : "bg-secondary/30"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              isActive
                ? "left-6"
                : "left-1"
            }`}
          />
        </button>
      </div>

      {/* =================================================
          ADMIN / MANAGER CONTEXT INFO
      ================================================= */}

      {!isSuperAdmin && (
        <div className="rounded-xl border border-primary/10 bg-muted-action/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                Business Context
              </p>

              <p className="mt-1 text-xs leading-5 text-secondary">
                This category will automatically
                belong to your assigned Business
                and Business Type. These values
                cannot be changed here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="flex justify-end gap-2 border-t border-primary/10 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={submitting}
          disabled={submitting}
        >
          {initialValues
            ? "Update Category"
            : "Create Category"}
        </Button>
      </div>
    </form>
  );
}