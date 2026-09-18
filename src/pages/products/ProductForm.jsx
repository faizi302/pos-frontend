import { useEffect, useMemo, useState } from "react";
import {
  X,
  Upload,
  Package,
  Store,
  Tag,
  Layers3,
  Barcode,
  FileText,
  Settings2,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import Button from "@/components/ui/Button";

import {
  useGetCategoriesQuery,
} from "../../features/category/categoryApi";

import {
  useGetBrandsByBusinessTypeQuery,
} from "../../features/brands/brandsApi";

import {
  useGetModelsByBrandQuery,
} from "../../features/models/modelsApi";

// ======================================================
// CONSTANTS
// ======================================================

const PRODUCT_TYPES = [
  {
    value: "simple",
    label: "Simple Product",
    description: "One product without variations",
  },
  {
    value: "variable",
    label: "Variable Product",
    description: "Product with multiple variations",
  },
  {
    value: "service",
    label: "Service",
    description: "A service instead of a physical product",
  },
  {
    value: "digital",
    label: "Digital Product",
    description: "Downloadable or digital product",
  },
  {
    value: "bundle",
    label: "Bundle",
    description: "Multiple products sold together",
  },
];

const UNITS = [
  "piece",
  "kg",
  "gram",
  "liter",
  "ml",
  "meter",
  "cm",
  "box",
  "pack",
  "dozen",
  "pair",
  "bottle",
  "bag",
  "carton",
  "set",
  "hour",
  "day",
  "service",
  "other",
];

const BARCODE_TYPES = [
  "EAN-13",
  "EAN-8",
  "UPC",
  "CODE128",
  "ISBN",
  "QR",
  "CUSTOM",
];

// ======================================================
// INITIAL STATE
// ======================================================

const defaultForm = {
  business: "",
  businessType: "",

  category: "",
  brand: "",
  model: "",

  name: "",
  slug: "",
  sku: "",
  barcode: "",
  barcodeType: "CUSTOM",

  shortDescription: "",
  description: "",

  productType: "simple",
  hasVariants: false,

  unit: "piece",

  purchasePrice: "",
  salePrice: "",
  discount: "0",
  tax: "0",

  isFeatured: false,
  isActive: true,
};

// ======================================================
// ID HELPER
// ======================================================

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value?._id || "";
};

// ======================================================
// DATA NORMALIZER
// ======================================================

const normalizeArray = (data, keys = []) => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

// ======================================================
// NAME FORMATTER
// ======================================================
//
// Converts:
//
// samsung -> Samsung
// s20 -> S20
// iphone 17 pro max -> Iphone 17 Pro Max
// hp -> Hp
//
// The first letter of every word becomes uppercase.
// ======================================================

const formatProductName = (value = "") => {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      );
    })
    .join(" ");
};

// ======================================================
// SLUG GENERATOR
// ======================================================

const generateSlug = (value = "") => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ======================================================
// COMPONENT
// ======================================================

const ProductForm = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(initialValues?._id);

  // ====================================================
  // CURRENT LOGGED-IN USER
  // ====================================================

  const authUser = useSelector(
    (state) =>
      state.auth?.user ||
      state.auth?.currentUser ||
      state.auth?.data?.user ||
      null
  );

  // ====================================================
  // ADMIN BUSINESS CONTEXT
  // ====================================================

  const userBusinessId = getId(authUser?.business);

  const userBusinessTypeId = getId(
    authUser?.businessType
  );

  const userBusinessName =
    typeof authUser?.business === "object"
      ? authUser.business?.name
      : authUser?.businessName || "";

  const userBusinessTypeName =
    typeof authUser?.businessType === "object"
      ? authUser.businessType?.name
      : authUser?.businessTypeName || "";

  // ====================================================
  // FORM STATE
  // ====================================================

  const [form, setForm] = useState(defaultForm);

  const [imageFiles, setImageFiles] = useState([]);

  const [imagePreviews, setImagePreviews] = useState([]);

  // ====================================================
  // FETCH CATEGORIES
  // ====================================================

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useGetCategoriesQuery(
    {
      business: userBusinessId,
      businessType: userBusinessTypeId,
    },
    {
      skip:
        !userBusinessId ||
        !userBusinessTypeId,
    }
  );

  // ====================================================
  // FETCH BRANDS
  // ====================================================

  const {
    data: brandsData,
    isLoading: brandsLoading,
  } = useGetBrandsByBusinessTypeQuery(
    userBusinessTypeId,
    {
      skip: !userBusinessTypeId,
    }
  );

  // ====================================================
  // FETCH MODELS
  // ====================================================

  const {
    data: modelsData,
    isLoading: modelsLoading,
  } = useGetModelsByBrandQuery(form.brand, {
    skip: !form.brand,
  });

  // ====================================================
  // NORMALIZE DATA
  // ====================================================

  const categories = useMemo(
    () =>
      normalizeArray(categoriesData, [
        "categories",
      ]),
    [categoriesData]
  );

  const brands = useMemo(
    () =>
      normalizeArray(brandsData, ["brands"]),
    [brandsData]
  );

  const models = useMemo(
    () =>
      normalizeArray(modelsData, ["models"]),
    [modelsData]
  );

  // ====================================================
  // SELECTED BRAND
  // ====================================================

  const selectedBrand = useMemo(() => {
    return brands.find(
      (brand) =>
        getId(brand) === form.brand
    );
  }, [brands, form.brand]);

  // ====================================================
  // SELECTED MODEL
  // ====================================================

  const selectedModel = useMemo(() => {
    return models.find(
      (model) =>
        getId(model) === form.model
    );
  }, [models, form.model]);

  // ====================================================
  // AUTO PRODUCT NAME
  // ====================================================

  const generatedProductName = useMemo(() => {
    const brandName =
      selectedBrand?.name || "";

    const modelName =
      selectedModel?.name || "";

    if (!brandName && !modelName) {
      return "";
    }

    if (brandName && modelName) {
      return `${formatProductName(
        brandName
      )} ${formatProductName(modelName)}`;
    }

    if (brandName) {
      return formatProductName(
        brandName
      );
    }

    return formatProductName(
      modelName
    );
  }, [selectedBrand, selectedModel]);

  // ====================================================
  // INITIALIZE FORM
  // ====================================================

  useEffect(() => {
    if (!initialValues) {
      setForm({
        ...defaultForm,
        business:
          userBusinessId || "",
        businessType:
          userBusinessTypeId || "",
      });

      setImageFiles([]);
      setImagePreviews([]);

      return;
    }

    setForm({
      business:
        getId(initialValues?.business) ||
        userBusinessId ||
        "",

      businessType:
        getId(initialValues?.businessType) ||
        userBusinessTypeId ||
        "",

      category:
        getId(initialValues?.category),

      brand:
        getId(initialValues?.brand),

      model:
        getId(initialValues?.model),

      name:
        initialValues?.name || "",

      slug:
        initialValues?.slug || "",

      sku:
        initialValues?.sku || "",

      barcode:
        initialValues?.barcode || "",

      barcodeType:
        initialValues?.barcodeType ||
        "CUSTOM",

      shortDescription:
        initialValues?.shortDescription ||
        "",

      description:
        initialValues?.description ||
        "",

      productType:
        initialValues?.productType ||
        "simple",

      hasVariants:
        initialValues?.hasVariants ||
        false,

      unit:
        initialValues?.unit ||
        "piece",

      purchasePrice:
        initialValues?.purchasePrice ?? "",

      salePrice:
        initialValues?.salePrice ?? "",

      discount:
        initialValues?.discount ?? "0",

      tax:
        initialValues?.tax ?? "0",

      isFeatured:
        initialValues?.isFeatured ||
        false,

      isActive:
        initialValues?.isActive ??
        true,
    });

    const existingImages =
      Array.isArray(initialValues?.images)
        ? initialValues.images
            .filter(
              (image) => image?.url
            )
            .map((image) => ({
              type: "existing",
              url: image.url,
              publicId:
                image.publicId,
            }))
        : [];

    setImagePreviews(
      existingImages
    );

    setImageFiles([]);
  }, [
    initialValues,
    userBusinessId,
    userBusinessTypeId,
  ]);

  // ====================================================
  // AUTO UPDATE PRODUCT NAME
  // ====================================================

  useEffect(() => {
    if (!selectedBrand && !selectedModel) {
      return;
    }

    if (!generatedProductName) {
      return;
    }

    setForm((previous) => {
      if (
        previous.name ===
        generatedProductName
      ) {
        return previous;
      }

      return {
        ...previous,
        name: generatedProductName,
      };
    });
  }, [
    generatedProductName,
    selectedBrand,
    selectedModel,
  ]);

  // ====================================================
  // AUTO SLUG
  // ====================================================

  useEffect(() => {
    if (!generatedProductName) {
      return;
    }

    setForm((previous) => {
      const generatedSlug =
        generateSlug(
          generatedProductName
        );

      if (
        previous.slug ===
        generatedSlug
      ) {
        return previous;
      }

      return {
        ...previous,
        slug: generatedSlug,
      };
    });
  }, [generatedProductName]);

  // ====================================================
  // FIELD CHANGE
  // ====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ====================================================
  // CATEGORY CHANGE
  // ====================================================

  const handleCategoryChange = (e) => {
    setForm((previous) => ({
      ...previous,
      category: e.target.value,
    }));
  };

  // ====================================================
  // BRAND CHANGE
  // ====================================================

  const handleBrandChange = (e) => {
    const brandId =
      e.target.value;

    setForm((previous) => ({
      ...previous,
      brand: brandId,
      model: "",
      name: "",
      slug: "",
    }));
  };

  // ====================================================
  // MODEL CHANGE
  // ====================================================

  const handleModelChange = (e) => {
    const modelId =
      e.target.value;

    setForm((previous) => ({
      ...previous,
      model: modelId,
    }));
  };

  // ====================================================
  // PRODUCT TYPE CHANGE
  // ====================================================

  const handleProductTypeChange = (
    e
  ) => {
    const productType =
      e.target.value;

    setForm((previous) => ({
      ...previous,
      productType,
      hasVariants:
        productType ===
        "variable",
    }));
  };

  // ====================================================
  // VARIANT CHANGE
  // ====================================================

  const handleVariantChange = (
    e
  ) => {
    const hasVariants =
      e.target.checked;

    setForm((previous) => ({
      ...previous,

      hasVariants,

      productType:
        hasVariants
          ? "variable"
          : previous.productType ===
              "variable"
            ? "simple"
            : previous.productType,
    }));
  };

  // ====================================================
  // IMAGE SELECT
  // ====================================================

  const handleImageChange = (e) => {
    const selectedFiles =
      Array.from(
        e.target.files || []
      );

    if (!selectedFiles.length) {
      return;
    }

    const totalImages =
      imageFiles.length +
      imagePreviews.length;

    if (
      totalImages +
        selectedFiles.length >
      10
    ) {
      toast.error(
        "You can upload a maximum of 10 images."
      );

      e.target.value = "";

      return;
    }

    const validFiles = [];

    for (const file of selectedFiles) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        toast.error(
          `${file.name} is not a valid image.`
        );

        continue;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        toast.error(
          `${file.name} exceeds the 5MB limit.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      e.target.value = "";

      return;
    }

    setImageFiles(
      (previous) => [
        ...previous,
        ...validFiles,
      ]
    );

    const newPreviews =
      validFiles.map(
        (file) => ({
          type: "new",
          url:
            URL.createObjectURL(
              file
            ),
          file,
        })
      );

    setImagePreviews(
      (previous) => [
        ...previous,
        ...newPreviews,
      ]
    );

    e.target.value = "";
  };

  // ====================================================
  // REMOVE IMAGE
  // ====================================================

  const handleRemoveImage = (
    index
  ) => {
    const image =
      imagePreviews[index];

    if (!image) return;

    if (image.type === "new") {
      setImageFiles(
        (previous) =>
          previous.filter(
            (file) =>
              file !==
              image.file
          )
      );

      if (image.url) {
        URL.revokeObjectURL(
          image.url
        );
      }
    }

    setImagePreviews(
      (previous) =>
        previous.filter(
          (_, imageIndex) =>
            imageIndex !==
            index
        )
    );
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateForm = () => {
    if (!form.business) {
      toast.error(
        "Your business is not assigned."
      );

      return false;
    }

    if (!form.businessType) {
      toast.error(
        "Your business type is not assigned."
      );

      return false;
    }

    if (!form.category) {
      toast.error(
        "Please select a category."
      );

      return false;
    }

    if (!form.brand) {
      toast.error(
        "Please select a brand."
      );

      return false;
    }

    if (!form.name.trim()) {
      toast.error(
        "Please select a brand and model to generate the product name."
      );

      return false;
    }

    if (!form.sku.trim()) {
      toast.error(
        "SKU is required."
      );

      return false;
    }

    if (
      form.salePrice === "" ||
      Number(form.salePrice) < 0
    ) {
      toast.error(
        "Please enter a valid sale price."
      );

      return false;
    }

    if (
      form.purchasePrice !== "" &&
      Number(form.purchasePrice) < 0
    ) {
      toast.error(
        "Please enter a valid purchase price."
      );

      return false;
    }

    if (
      Number(form.discount) < 0 ||
      Number(form.discount) > 100
    ) {
      toast.error(
        "Discount must be between 0 and 100."
      );

      return false;
    }

    if (Number(form.tax) < 0) {
      toast.error(
        "Tax cannot be negative."
      );

      return false;
    }

    if (
      form.productType ===
        "variable" &&
      !form.hasVariants
    ) {
      toast.error(
        "Variable products must have variants."
      );

      return false;
    }

    return true;
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (
      typeof onSubmit !==
      "function"
    ) {
      toast.error(
        "Product submit handler is not configured."
      );

      console.error(
        "ProductForm requires an onSubmit function."
      );

      return;
    }

    const formData =
      new FormData();

    // ==================================================
    // BUSINESS CONTEXT
    // ==================================================

    formData.append(
      "business",
      form.business
    );

    formData.append(
      "businessType",
      form.businessType
    );

    // ==================================================
    // CATALOG
    // ==================================================

    formData.append(
      "category",
      form.category
    );

    formData.append(
      "brand",
      form.brand
    );

    if (form.model) {
      formData.append(
        "model",
        form.model
      );
    }

    // ==================================================
    // BASIC INFORMATION
    // ==================================================

    formData.append(
      "name",
      form.name.trim()
    );

    if (form.slug.trim()) {
      formData.append(
        "slug",
        form.slug
          .trim()
          .toLowerCase()
      );
    }

    formData.append(
      "sku",
      form.sku
        .trim()
        .toUpperCase()
    );

    if (form.barcode.trim()) {
      formData.append(
        "barcode",
        form.barcode.trim()
      );
    }

    formData.append(
      "barcodeType",
      form.barcode.trim()
        ? form.barcodeType
        : "CUSTOM"
    );

    // ==================================================
    // DESCRIPTION
    // ==================================================

    formData.append(
      "shortDescription",
      form.shortDescription.trim()
    );

    formData.append(
      "description",
      form.description.trim()
    );

    // ==================================================
    // PRODUCT CONFIGURATION
    // ==================================================

    formData.append(
      "productType",
      form.productType
    );

    formData.append(
      "hasVariants",
      String(form.hasVariants)
    );

    formData.append(
      "unit",
      form.unit
    );

    // ==================================================
    // PRICING
    // ==================================================

    formData.append(
      "purchasePrice",
      String(
        form.purchasePrice === ""
          ? 0
          : Number(
              form.purchasePrice
            )
      )
    );

    formData.append(
      "salePrice",
      String(
        Number(form.salePrice)
      )
    );

    formData.append(
      "discount",
      String(
        Number(
          form.discount || 0
        )
      )
    );

    formData.append(
      "tax",
      String(
        Number(
          form.tax || 0
        )
      )
    );

    // ==================================================
    // STATUS
    // ==================================================

    formData.append(
      "isFeatured",
      String(form.isFeatured)
    );

    formData.append(
      "isActive",
      String(form.isActive)
    );

    // ==================================================
    // IMAGES
    // ==================================================

    imageFiles.forEach(
      (file) => {
        formData.append(
          "images",
          file
        );
      }
    );

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(
        "Product form submit error:",
        error
      );
    }
  };

  // ====================================================
  // STYLES
  // ====================================================

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

  const textareaClass =
    "min-h-[110px] w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10";

  const labelClass =
    "mb-2 block text-sm font-medium";

  const sectionClass =
    "overflow-hidden rounded-2xl border border-border bg-background shadow-sm";

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-6xl space-y-6 pb-8"
    >
      {/* ==================================================
          PAGE INTRO
      ================================================== */}

      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isEditMode
                  ? "Update Product"
                  : "Create New Product"}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your product information,
                pricing, images and inventory
                settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4" />

            <span>
              Fields marked * are required
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          BUSINESS & CATALOG
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Business & Catalog
              </h2>

              <p className="text-xs text-muted-foreground">
                Your business context is assigned
                automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Business */}

            <div>
              <label className={labelClass}>
                Business
              </label>

              <div className="flex h-11 items-center rounded-xl border border-border bg-muted/30 px-3.5 text-sm">
                {userBusinessName ||
                  "Not assigned"}
              </div>
            </div>

            {/* Business Type */}

            <div>
              <label className={labelClass}>
                Business Type
              </label>

              <div className="flex h-11 items-center rounded-xl border border-border bg-muted/30 px-3.5 text-sm">
                {userBusinessTypeName ||
                  "Not assigned"}
              </div>
            </div>

            {/* Category */}

            <div>
              <label className={labelClass}>
                Category
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="category"
                value={form.category}
                onChange={
                  handleCategoryChange
                }
                disabled={
                  !form.business ||
                  !form.businessType ||
                  categoriesLoading
                }
                className={inputClass}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select Category"}
                </option>

                {categories
                  .filter(
                    (category) =>
                      category?.isActive !==
                      false
                  )
                  .map(
                    (category) => (
                      <option
                        key={
                          category._id
                        }
                        value={
                          category._id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
              </select>
            </div>

            {/* Brand */}

            <div>
              <label className={labelClass}>
                Brand
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="brand"
                value={form.brand}
                onChange={
                  handleBrandChange
                }
                disabled={
                  !form.business ||
                  !form.businessType ||
                  brandsLoading
                }
                className={inputClass}
              >
                <option value="">
                  {brandsLoading
                    ? "Loading brands..."
                    : "Select Brand"}
                </option>

                {brands
                  .filter(
                    (brand) =>
                      brand?.isActive !==
                      false
                  )
                  .map(
                    (brand) => (
                      <option
                        key={
                          brand._id
                        }
                        value={
                          brand._id
                        }
                      >
                        {brand.name}
                      </option>
                    )
                  )}
              </select>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Select the manufacturer or
                brand.
              </p>
            </div>

            {/* Model */}

            <div className="md:col-span-2">
              <label className={labelClass}>
                Model
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Optional
                </span>
              </label>

              <select
                name="model"
                value={form.model}
                onChange={
                  handleModelChange
                }
                disabled={
                  !form.brand ||
                  modelsLoading
                }
                className={inputClass}
              >
                <option value="">
                  {modelsLoading
                    ? "Loading models..."
                    : !form.brand
                      ? "Select a brand first"
                      : "No Model / Select Model"}
                </option>

                {models
                  .filter(
                    (model) =>
                      model?.isActive !==
                      false
                  )
                  .map(
                    (model) => (
                      <option
                        key={
                          model._id
                        }
                        value={
                          model._id
                        }
                      >
                        {model.name}
                      </option>
                    )
                  )}
              </select>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Models are automatically filtered
                according to the selected brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          AUTO PRODUCT NAME
      ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-sm">
        <div className="border-b border-primary/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Product Name
              </h2>

              <p className="text-xs text-muted-foreground">
                Generated automatically from Brand
                + Model.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-primary/20 bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">
                Product Name
              </label>

              <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Auto Generated
              </span>
            </div>

            <div className="flex min-h-12 items-center rounded-xl border border-border bg-muted/20 px-4">
              {generatedProductName ? (
                <span className="text-base font-semibold">
                  {generatedProductName}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Select a brand and model to
                  generate the product name.
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Brand:
              </span>

              <span className="rounded-md bg-muted px-2 py-1 font-medium">
                {selectedBrand?.name ||
                  "Not selected"}
              </span>

              <span>+</span>

              <span>
                Model:
              </span>

              <span className="rounded-md bg-muted px-2 py-1 font-medium">
                {selectedModel?.name ||
                  "Not selected"}
              </span>

              <span>=</span>

              <span className="font-semibold text-foreground">
                {generatedProductName ||
                  "Product Name"}
              </span>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

            Product names are automatically formatted
            with the first letter of each word in
            uppercase.
          </p>
        </div>
      </section>

      {/* ==================================================
          SKU & IDENTIFICATION
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Barcode className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Product Identification
              </h2>

              <p className="text-xs text-muted-foreground">
                SKU and barcode information.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Slug */}

            <div>
              <label className={labelClass}>
                Slug
              </label>

              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={
                  handleChange
                }
                placeholder="samsung-s20"
                className={inputClass}
              />

              <p className="mt-1.5 text-xs text-muted-foreground">
                Generated automatically from the
                product name.
              </p>
            </div>

            {/* SKU */}

            <div>
              <label className={labelClass}>
                SKU
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={
                  handleChange
                }
                placeholder="SAM-S20-128"
                className={`${inputClass} font-mono uppercase`}
              />

              <p className="mt-1.5 text-xs text-muted-foreground">
                Your unique stock keeping unit.
              </p>
            </div>

            {/* Barcode */}

            <div>
              <label className={labelClass}>
                Barcode
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Optional
                </span>
              </label>

              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={
                  handleChange
                }
                placeholder="Enter barcode"
                className={inputClass}
              />
            </div>

            {/* Barcode Type */}

            <div>
              <label className={labelClass}>
                Barcode Type
              </label>

              <select
                name="barcodeType"
                value={
                  form.barcodeType
                }
                onChange={
                  handleChange
                }
                disabled={
                  !form.barcode.trim()
                }
                className={inputClass}
              >
                {BARCODE_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              {!form.barcode.trim() && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Barcode type will be saved as
                  CUSTOM when no barcode is entered.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          DESCRIPTION
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Description
              </h2>

              <p className="text-xs text-muted-foreground">
                Add useful information about this
                product.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label className={labelClass}>
              Short Description
            </label>

            <textarea
              name="shortDescription"
              value={
                form.shortDescription
              }
              onChange={
                handleChange
              }
              maxLength={500}
              placeholder="Write a short description..."
              className={
                textareaClass
              }
            />

            <div className="mt-1 flex justify-end text-xs text-muted-foreground">
              {
                form.shortDescription
                  .length
              }
              /500
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Full Description
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              placeholder="Write detailed product information..."
              className="min-h-[160px] w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          PRODUCT CONFIGURATION
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Product Configuration
              </h2>

              <p className="text-xs text-muted-foreground">
                Define how this product behaves in
                your POS.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Product Type */}

          <div>
            <label className={labelClass}>
              Product Type
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_TYPES.map(
                (type) => {
                  const isSelected =
                    form.productType ===
                    type.value;

                  return (
                    <label
                      key={
                        type.value
                      }
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="productType"
                        value={
                          type.value
                        }
                        checked={
                          isSelected
                        }
                        onChange={
                          handleProductTypeChange
                        }
                        className="sr-only"
                      />

                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-primary"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {
                              type.label
                            }
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {
                              type.description
                            }
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* Unit */}

          <div className="mt-6 max-w-md">
            <label className={labelClass}>
              Selling Unit
            </label>

            <select
              name="unit"
              value={form.unit}
              onChange={
                handleChange
              }
              className={inputClass}
            >
              {UNITS.map(
                (unit) => (
                  <option
                    key={unit}
                    value={unit}
                  >
                    {unit.charAt(
                      0
                    ).toUpperCase() +
                      unit.slice(
                        1
                      )}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Variants */}

          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="hasVariants"
                checked={
                  form.hasVariants
                }
                onChange={
                  handleVariantChange
                }
                className="mt-1 h-4 w-4 rounded border-border"
              />

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Layers3 className="h-4 w-4" />

                  This product has variants
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Enable this when the same product
                  has different variations such as
                  storage, color, size or other
                  options.
                </p>
              </div>
            </label>

            {form.hasVariants && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <span>
                  Variable products are automatically
                  configured as{" "}
                  <strong className="text-foreground">
                    Variable Product
                  </strong>
                  .
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          PRICING
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Pricing
              </h2>

              <p className="text-xs text-muted-foreground">
                Set purchase, selling, discount and
                tax values.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Purchase Price */}

            <div>
              <label className={labelClass}>
                Purchase Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="purchasePrice"
                value={
                  form.purchasePrice
                }
                onChange={
                  handleChange
                }
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            {/* Sale Price */}

            <div>
              <label className={labelClass}>
                Sale Price
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="salePrice"
                value={
                  form.salePrice
                }
                onChange={
                  handleChange
                }
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            {/* Discount */}

            <div>
              <label className={labelClass}>
                Discount (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                name="discount"
                value={
                  form.discount
                }
                onChange={
                  handleChange
                }
                placeholder="0"
                className={inputClass}
              />
            </div>

            {/* Tax */}

            <div>
              <label className={labelClass}>
                Tax (%)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="tax"
                value={form.tax}
                onChange={
                  handleChange
                }
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          IMAGES
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Product Images
              </h2>

              <p className="text-xs text-muted-foreground">
                Upload up to 10 images, maximum 5MB
                each.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/[0.03]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted transition group-hover:bg-primary/10">
              <Upload className="h-7 w-7 text-muted-foreground transition group-hover:text-primary" />
            </div>

            <p className="mt-4 text-sm font-semibold">
              Click to upload product images
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, JPEG or WEBP
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleImageChange
              }
              className="hidden"
            />
          </label>

          {imagePreviews.length >
            0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {imagePreviews.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={image.url}
                      alt={`Product ${
                        index + 1
                      }`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveImage(
                          index
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {index ===
                      0 && (
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                        Main Image
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          STATUS
      ================================================== */}

      <section className={sectionClass}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Product Status
              </h2>

              <p className="text-xs text-muted-foreground">
                Control product visibility and
                featured status.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
          {/* Active */}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:bg-muted/30">
            <input
              type="checkbox"
              name="isActive"
              checked={
                form.isActive
              }
              onChange={
                handleChange
              }
              className="mt-1 h-4 w-4 rounded"
            />

            <div>
              <p className="text-sm font-semibold">
                Active Product
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The product will be available and
                visible in the active catalog.
              </p>
            </div>
          </label>

          {/* Featured */}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:bg-muted/30">
            <input
              type="checkbox"
              name="isFeatured"
              checked={
                form.isFeatured
              }
              onChange={
                handleChange
              }
              className="mt-1 h-4 w-4 rounded"
            />

            <div>
              <p className="text-sm font-semibold">
                Featured Product
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Highlight this product in featured
                product areas.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="sticky bottom-0 z-10 -mx-2 border-t border-border bg-background/95 px-2 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-2 sm:backdrop-blur-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={
              isSubmitting
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !generatedProductName
            }
          >
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Update Product"
                : "Create Product"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;