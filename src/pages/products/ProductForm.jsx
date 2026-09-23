import { useEffect, useMemo, useState } from "react";
import {
  X,
  Upload,
  Package,
  Store,
  Barcode,
  FileText,
  Settings2,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  Smartphone,
  Layers3,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import Button from "@/components/ui/Button";

import { useGetCategoriesQuery } from "../../features/category/categoryApi";
import { useGetBrandsByBusinessTypeQuery } from "../../features/brands/brandsApi";
import { useGetModelsByBrandQuery } from "../../features/models/modelsApi";

const PRODUCT_TYPES = [
  { value: "simple", label: "Simple Product", description: "One product without variations" },
  { value: "variable", label: "Variable Product", description: "Product with multiple variations" },
  { value: "service", label: "Service", description: "A service instead of a physical product" },
  { value: "digital", label: "Digital Product", description: "Downloadable or digital product" },
  { value: "bundle", label: "Bundle", description: "Multiple products sold together" },
];

const UNITS = [
  "piece", "kg", "gram", "liter", "ml", "meter", "cm",
  "box", "pack", "dozen", "pair", "bottle", "bag",
  "carton", "set", "hour", "day", "service", "other",
];

const BARCODE_TYPES = ["EAN-13", "EAN-8", "UPC", "CODE128", "ISBN", "QR", "CUSTOM"];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const normalizeArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const defaultForm = {
  category: "",
  brand: "",
  model: "",
  name: "",
  barcode: "",
  barcodeType: "CUSTOM",
  shortDescription: "",
  description: "",
  productType: "simple",
  hasVariants: false,
  trackSerial: false,
  unit: "piece",
  isFeatured: false,
  isActive: true,
};

const ProductForm = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(initialValues?._id);

  const authUser = useSelector(
    (state) =>
      state.auth?.user ||
      state.auth?.currentUser ||
      state.auth?.data?.user ||
      null
  );

  const userBusinessId = getId(authUser?.business);
  const userBusinessTypeId = getId(authUser?.businessType);

  const [form, setForm] = useState(defaultForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [removeImages, setRemoveImages] = useState([]); // publicIds to remove on update

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesQuery(
      { business: userBusinessId, businessType: userBusinessTypeId },
      { skip: !userBusinessId || !userBusinessTypeId }
    );

  const { data: brandsData, isLoading: brandsLoading } =
    useGetBrandsByBusinessTypeQuery(userBusinessTypeId, {
      skip: !userBusinessTypeId,
    });

  const { data: modelsData, isLoading: modelsLoading } =
    useGetModelsByBrandQuery(form.brand, { skip: !form.brand });

  const categories = useMemo(
    () => normalizeArray(categoriesData, ["categories"]),
    [categoriesData]
  );
  const brands = useMemo(
    () => normalizeArray(brandsData, ["brands"]),
    [brandsData]
  );
  const models = useMemo(
    () => normalizeArray(modelsData, ["models"]),
    [modelsData]
  );

  // Initialize form
  useEffect(() => {
    if (!initialValues) {
      setForm(defaultForm);
      setImageFiles([]);
      setImagePreviews([]);
      setRemoveImages([]);
      return;
    }

    setForm({
      category: getId(initialValues?.category),
      brand: getId(initialValues?.brand),
      model: getId(initialValues?.model),
      name: initialValues?.name || "",
      barcode: initialValues?.barcode || "",
      barcodeType: initialValues?.barcodeType || "CUSTOM",
      shortDescription: initialValues?.shortDescription || "",
      description: initialValues?.description || "",
      productType: initialValues?.productType || "simple",
      hasVariants: initialValues?.hasVariants || false,
      trackSerial: initialValues?.trackSerial || false,
      unit: initialValues?.unit || "piece",
      isFeatured: initialValues?.isFeatured || false,
      isActive: initialValues?.isActive ?? true,
    });

    const existing = Array.isArray(initialValues?.images)
      ? initialValues.images
          .filter((img) => img?.url)
          .map((img) => ({
            type: "existing",
            url: img.url,
            publicId: img.publicId,
          }))
      : [];

    setImagePreviews(existing);
    setImageFiles([]);
    setRemoveImages([]);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBrandChange = (e) => {
    setForm((prev) => ({
      ...prev,
      brand: e.target.value,
      model: "",
    }));
  };

  const handleProductTypeChange = (e) => {
    const productType = e.target.value;
    setForm((prev) => ({
      ...prev,
      productType,
      hasVariants: productType === "variable",
    }));
  };

  const handleVariantChange = (e) => {
    const hasVariants = e.target.checked;
    setForm((prev) => ({
      ...prev,
      hasVariants,
      productType: hasVariants
        ? "variable"
        : prev.productType === "variable"
        ? "simple"
        : prev.productType,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const total = imageFiles.length + imagePreviews.filter((i) => i.type === "existing").length;
    if (total + selectedFiles.length > 10) {
      toast.error("You can upload a maximum of 10 images.");
      e.target.value = "";
      return;
    }

    const validFiles = [];
    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => ({
      type: "new",
      url: URL.createObjectURL(file),
      file,
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    const image = imagePreviews[index];
    if (!image) return;

    if (image.type === "existing" && image.publicId) {
      setRemoveImages((prev) => [...prev, image.publicId]);
    }

    if (image.type === "new") {
      setImageFiles((prev) => prev.filter((f) => f !== image.file));
      if (image.url) URL.revokeObjectURL(image.url);
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!form.category) {
      toast.error("Category is required");
      return false;
    }
    if (!form.brand) {
      toast.error("Brand is required");
      return false;
    }
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (form.productType === "variable" && !form.hasVariants) {
      toast.error("Variable products must have variants enabled");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (typeof onSubmit !== "function") {
      toast.error("Submit handler is not configured.");
      return;
    }

    const formData = new FormData();

    // Only editable fields — never sku / slug / business / businessType
    formData.append("category", form.category);
    formData.append("brand", form.brand);
    formData.append("name", form.name.trim());

    if (form.model) formData.append("model", form.model);
    if (form.barcode.trim()) formData.append("barcode", form.barcode.trim());
    formData.append("barcodeType", form.barcode.trim() ? form.barcodeType : "CUSTOM");

    formData.append("shortDescription", form.shortDescription.trim());
    formData.append("description", form.description.trim());
    formData.append("productType", form.productType);
    formData.append("hasVariants", String(form.hasVariants));
    formData.append("trackSerial", String(form.trackSerial));
    formData.append("unit", form.unit);
    formData.append("isFeatured", String(form.isFeatured));
    formData.append("isActive", String(form.isActive));

    // New images
    imageFiles.forEach((file) => formData.append("images", file));

    // Images to remove (update only)
    if (isEditMode && removeImages.length > 0) {
      formData.append("removeImages", JSON.stringify(removeImages));
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Product form submit error:", error);
    }
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-primary bg-surface px-4 text-sm text-primary outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:opacity-60";
  const textareaClass =
    "min-h-[110px] w-full rounded-xl border border-primary bg-surface px-4 py-3 text-sm text-primary outline-none transition focus:border-brand";
  const labelClass = "mb-2 block text-sm font-medium text-primary";
  const sectionClass = "overflow-hidden rounded-2xl border border-primary bg-card shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-primary bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">
                {isEditMode ? "Update Product" : "Create New Product"}
              </h1>
              <p className="mt-1 text-sm text-secondary">
                Fill in product details. SKU & slug are generated automatically by the system.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-xs text-secondary">
            <Info size={14} />
            <span>Fields marked * are required</span>
          </div>
        </div>
      </div>

      {/* 1. Catalog */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Store size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Catalog</h2>
              <p className="text-xs text-secondary">Category, Brand and Model</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <label className={labelClass}>
              Category <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
              disabled={categoriesLoading}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={getId(cat)} value={getId(cat)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Brand <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="brand"
              value={form.brand}
              onChange={handleBrandChange}
              className={inputClass}
              disabled={brandsLoading}
            >
              <option value="">Select Brand</option>
              {brands.map((brand) => (
                <option key={getId(brand)} value={getId(brand)}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Model</label>
            <select
              name="model"
              value={form.model}
              onChange={handleChange}
              className={inputClass}
              disabled={!form.brand || modelsLoading}
            >
              <option value="">Select Model</option>
              {models.map((model) => (
                <option key={getId(model)} value={getId(model)}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 2. Product Name */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Package size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Product Name</h2>
              <p className="text-xs text-secondary">Enter the product name (Title Case recommended)</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label className={labelClass}>
            Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Samsung Galaxy S20"
            className={inputClass}
          />
        </div>
      </section>

      {/* 3. Identification */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Barcode size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Identification</h2>
              <p className="text-xs text-secondary">Barcode only (SKU & slug are auto-generated)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label className={labelClass}>Barcode (Optional)</label>
            <input
              type="text"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder="Enter barcode"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Barcode Type</label>
            <select
              name="barcodeType"
              value={form.barcodeType}
              onChange={handleChange}
              disabled={!form.barcode.trim()}
              className={inputClass}
            >
              {BARCODE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 4. Configuration */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Settings2 size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Configuration</h2>
              <p className="text-xs text-secondary">Product type, unit and serial tracking</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <label className={labelClass}>Product Type</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_TYPES.map((type) => {
                const isSelected = form.productType === type.value;
                return (
                  <label
                    key={type.value}
                    className={`relative cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                        : "border-primary hover:bg-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      value={type.value}
                      checked={isSelected}
                      onChange={handleProductTypeChange}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? "border-brand" : "border-secondary"
                        }`}
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-brand" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{type.label}</p>
                        <p className="mt-1 text-xs text-secondary">{type.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="max-w-xs">
            <label className={labelClass}>Selling Unit</label>
            <select name="unit" value={form.unit} onChange={handleChange} className={inputClass}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary p-4 transition hover:bg-surface">
              <input
                type="checkbox"
                name="hasVariants"
                checked={form.hasVariants}
                onChange={handleVariantChange}
                className="mt-1 h-4 w-4 rounded"
              />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Layers3 size={16} />
                  This product has variants
                </p>
                <p className="mt-1 text-xs text-secondary">
                  Enable for color, size, storage etc.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary p-4 transition hover:bg-surface">
              <input
                type="checkbox"
                name="trackSerial"
                checked={form.trackSerial}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded"
              />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Smartphone size={16} />
                  Track Serial / IMEI
                </p>
                <p className="mt-1 text-xs text-secondary">
                  Enable for mobiles and high-value items
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 5. Description */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Description</h2>
              <p className="text-xs text-secondary">Optional product details</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label className={labelClass}>Short Description</label>
            <textarea
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              maxLength={500}
              placeholder="Write a short description..."
              className={textareaClass}
            />
            <div className="mt-1 text-right text-xs text-secondary">
              {form.shortDescription.length}/500
            </div>
          </div>

          <div>
            <label className={labelClass}>Full Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write detailed product information..."
              className="min-h-[140px] w-full rounded-xl border border-primary bg-surface px-4 py-3 text-sm text-primary outline-none transition focus:border-brand"
            />
          </div>
        </div>
      </section>

      {/* 6. Images */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Product Images</h2>
              <p className="text-xs text-secondary">Upload up to 10 images (max 5MB each)</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary p-8 text-center transition hover:border-brand/40 hover:bg-brand/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface transition group-hover:bg-brand/10">
              <Upload size={28} className="text-secondary transition group-hover:text-brand" />
            </div>
            <p className="mt-4 text-sm font-semibold text-primary">
              Click to upload product images
            </p>
            <p className="mt-1 text-xs text-secondary">PNG, JPG, JPEG or WEBP</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {imagePreviews.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {imagePreviews.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-primary bg-surface"
                >
                  <img
                    src={image.url}
                    alt={`Product ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. Status */}
      <section className={sectionClass}>
        <div className="border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Status</h2>
              <p className="text-xs text-secondary">Visibility settings</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary p-4 transition hover:bg-surface">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-primary">Active Product</p>
              <p className="mt-1 text-xs text-secondary">
                Product will be available in the catalog
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary p-4 transition hover:bg-surface">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-primary">Featured Product</p>
              <p className="mt-1 text-xs text-secondary">
                Highlight this product in featured areas
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
            ? "Update Product"
            : "Create Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;