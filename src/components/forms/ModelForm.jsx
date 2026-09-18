
import { useEffect, useMemo, useState } from "react";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";
import { useGetBusinessTypesQuery } from "@/features/businessTypes/businessTypesApi";
import { useGetBrandsQuery } from "@/features/brands/brandsApi";

const emptyForm = {
  name: "",
  brand: "",
  description: "",
  isActive: true,
};

export default function ModelForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}) {
  // =====================================================
  // FETCH DATA
  // =====================================================

  const { data: businesses } = useGetBusinessesQuery();

  const { data: businessTypes } =
    useGetBusinessTypesQuery();

  const { data: brands } = useGetBrandsQuery();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [business, setBusiness] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [form, setForm] = useState(emptyForm);

  const [errors, setErrors] = useState({});

  // =====================================================
  // EDIT / CREATE INITIALIZATION
  // =====================================================

  useEffect(() => {
    if (!initialValues) {
      setBusiness("");
      setBusinessType("");
      setForm(emptyForm);
      setErrors({});

      return;
    }

    const brandId =
      initialValues.brand?._id ||
      initialValues.brand ||
      "";

    // -----------------------------------------------
    // Get business type directly from model if
    // backend populated it.
    // -----------------------------------------------

    const businessTypeId =
      initialValues.businessType?._id ||
      initialValues.businessType ||
      "";

    // -----------------------------------------------
    // Get business directly from model if available.
    // Otherwise get it from business type.
    // -----------------------------------------------

    let businessId =
      initialValues.business?._id ||
      initialValues.business ||
      "";

    if (!businessId && businessTypeId) {
      const businessTypeData = businessTypes?.find(
        (bt) => bt._id === businessTypeId
      );

      businessId =
        businessTypeData?.business?._id ||
        businessTypeData?.business ||
        "";
    }

    // -----------------------------------------------
    // If backend doesn't populate business/businessType
    // on the model, find the brand and use its context.
    // -----------------------------------------------

    if (!businessId || !businessTypeId) {
      const brandData = brands?.find(
        (brand) => brand._id === brandId
      );

      if (brandData) {
        if (!businessTypeId) {
          const brandBusinessTypeId =
            brandData.businessType?._id ||
            brandData.businessType ||
            "";

          setBusinessType(brandBusinessTypeId);

          const businessTypeData =
            businessTypes?.find(
              (bt) => bt._id === brandBusinessTypeId
            );

          if (!businessId) {
            businessId =
              brandData.business?._id ||
              brandData.business ||
              businessTypeData?.business?._id ||
              businessTypeData?.business ||
              "";
          }
        }
      }
    }

    setBusiness(businessId);
    setBusinessType(businessTypeId);

    setForm({
      name: initialValues.name || "",
      brand: brandId,
      description: initialValues.description || "",
      isActive:
        initialValues.isActive !== undefined
          ? initialValues.isActive
          : true,
    });

    setErrors({});
  }, [
    initialValues,
    brands,
    businessTypes,
  ]);

  // =====================================================
  // BUSINESS OPTIONS
  // =====================================================

  const businessOptions = useMemo(() => {
    return (businesses || []).map((businessItem) => ({
      value: businessItem._id,
      label: businessItem.name,
    }));
  }, [businesses]);

  // =====================================================
  // BUSINESS TYPE OPTIONS
  // =====================================================

  const businessTypeOptions = useMemo(() => {
    if (!businessTypes) return [];

    const filteredBusinessTypes = business
      ? businessTypes.filter(
          (businessTypeItem) =>
            (businessTypeItem.business?._id ||
              businessTypeItem.business) === business
        )
      : [];

    return filteredBusinessTypes.map(
      (businessTypeItem) => ({
        value: businessTypeItem._id,
        label: businessTypeItem.name,
      })
    );
  }, [businessTypes, business]);

  // =====================================================
  // BRAND OPTIONS
  // =====================================================

  const brandOptions = useMemo(() => {
    if (!brands) return [];

    const filteredBrands = businessType
      ? brands.filter(
          (brandItem) =>
            (brandItem.businessType?._id ||
              brandItem.businessType) ===
            businessType
        )
      : [];

    return filteredBrands.map((brandItem) => ({
      value: brandItem._id,
      label: brandItem.name,
    }));
  }, [brands, businessType]);

  // =====================================================
  // BUSINESS CHANGE
  // =====================================================

  function handleBusinessChange(value) {
    setBusiness(value);

    setBusinessType("");

    setForm((current) => ({
      ...current,
      brand: "",
    }));

    setErrors((current) => ({
      ...current,
      business: "",
      businessType: "",
      brand: "",
    }));
  }

  // =====================================================
  // BUSINESS TYPE CHANGE
  // =====================================================

  function handleBusinessTypeChange(value) {
    setBusinessType(value);

    setForm((current) => ({
      ...current,
      brand: "",
    }));

    setErrors((current) => ({
      ...current,
      businessType: "",
      brand: "",
    }));
  }

  // =====================================================
  // BRAND CHANGE
  // =====================================================

  function handleBrandChange(value) {
    setForm((current) => ({
      ...current,
      brand: value,
    }));

    setErrors((current) => ({
      ...current,
      brand: "",
    }));
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  function validate() {
    const nextErrors = {};

    if (!business) {
      nextErrors.business = "Business is required";
    }

    if (!businessType) {
      nextErrors.businessType =
        "Business type is required";
    }

    if (!form.brand) {
      nextErrors.brand = "Brand is required";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Model name is required";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),

      // IMPORTANT:
      // These were missing before.
      business,

      businessType,

      brand: form.brand,

      description: form.description.trim(),

      isActive: form.isActive,
    });
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* =================================================
          BUSINESS
      ================================================= */}

      <Select
        label="Business"
        hint="Select the business for this model."
        options={businessOptions}
        value={business}
        error={errors.business}
        placeholder="Select business"
        onChange={(e) =>
          handleBusinessChange(e.target.value)
        }
      />

      {/* =================================================
          BUSINESS TYPE
      ================================================= */}

      <Select
        label="Business Type"
        hint={
          business
            ? "Select a business type from the selected business."
            : "First select a business."
        }
        options={businessTypeOptions}
        value={businessType}
        error={errors.businessType}
        placeholder="Select business type"
        disabled={!business}
        onChange={(e) =>
          handleBusinessTypeChange(e.target.value)
        }
      />

      {/* =================================================
          BRAND
      ================================================= */}

      <Select
        label="Brand"
        hint={
          businessType
            ? "Select a brand from the selected business type."
            : "First select a business type."
        }
        options={brandOptions}
        value={form.brand}
        error={errors.brand}
        placeholder="Select brand"
        disabled={!businessType}
        onChange={(e) =>
          handleBrandChange(e.target.value)
        }
      />

      {/* =================================================
          MODEL NAME
      ================================================= */}

      <Input
        label="Model Name"
        placeholder="e.g. Samsung S20"
        value={form.name}
        error={errors.name}
        onChange={(e) =>
          setForm((current) => ({
            ...current,
            name: e.target.value,
          }))
        }
      />

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <Textarea
        label="Description"
        placeholder="Optional description"
        value={form.description}
        onChange={(e) =>
          setForm((current) => ({
            ...current,
            description: e.target.value,
          }))
        }
      />

      {/* =================================================
          STATUS
      ================================================= */}

      <label className="flex items-center gap-2 text-sm text-primary">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              isActive: e.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-primary accent-[var(--action-primary)]"
        />

        Active
      </label>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={submitting}
        >
          {initialValues
            ? "Save changes"
            : "Create model"}
        </Button>
      </div>
    </form>
  );
}
