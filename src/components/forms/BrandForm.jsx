import { useEffect, useMemo, useState } from "react";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";
import { useGetBusinessTypesQuery } from "@/features/businessTypes/businessTypesApi";

// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm = {
  name: "",
  business: "",
  businessType: "",
  description: "",
  isActive: true,
};

export default function BrandForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}) {
  // ==========================================================
  // BUSINESS DATA
  // ==========================================================

  const { data: businesses } = useGetBusinessesQuery();

  const { data: businessTypes } =
    useGetBusinessTypesQuery();

  // ==========================================================
  // STATE
  // ==========================================================

  const [form, setForm] = useState(emptyForm);

  const [errors, setErrors] = useState({});

  // ==========================================================
  // INITIAL VALUES / EDIT MODE
  // ==========================================================

  useEffect(() => {
    if (initialValues) {
      const businessId =
        initialValues.business?._id ||
        initialValues.business ||
        "";

      const businessTypeId =
        initialValues.businessType?._id ||
        initialValues.businessType ||
        "";

      setForm({
        name: initialValues.name || "",
        business: businessId,
        businessType: businessTypeId,
        description: initialValues.description || "",
        isActive:
          initialValues.isActive !== undefined
            ? initialValues.isActive
            : true,
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [initialValues]);

  // ==========================================================
  // BUSINESS TYPE OPTIONS
  // ==========================================================

  const businessTypeOptions = useMemo(() => {
    if (!businessTypes) return [];

    const filteredBusinessTypes = form.business
      ? businessTypes.filter(
          (businessType) =>
            (businessType.business?._id ||
              businessType.business) === form.business
        )
      : [];

    return filteredBusinessTypes.map((businessType) => ({
      value: businessType._id,
      label: businessType.name,
    }));
  }, [businessTypes, form.business]);

  // ==========================================================
  // BUSINESS OPTIONS
  // ==========================================================

  const businessOptions = useMemo(() => {
    return (businesses || []).map((business) => ({
      value: business._id,
      label: business.name,
    }));
  }, [businesses]);

  // ==========================================================
  // BUSINESS CHANGE
  // ==========================================================

  function handleBusinessChange(value) {
    setForm((current) => ({
      ...current,
      business: value,
      businessType: "",
    }));

    setErrors((current) => ({
      ...current,
      business: "",
      businessType: "",
    }));
  }

  // ==========================================================
  // BUSINESS TYPE CHANGE
  // ==========================================================

  function handleBusinessTypeChange(value) {
    setForm((current) => ({
      ...current,
      businessType: value,
    }));

    setErrors((current) => ({
      ...current,
      businessType: "",
    }));
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validate() {
    const nextErrors = {};

    if (!form.business) {
      nextErrors.business = "Business is required";
    }

    if (!form.businessType) {
      nextErrors.businessType =
        "Business type is required";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Brand name is required";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    // IMPORTANT:
    // Send BOTH business and businessType to backend.
    onSubmit({
      name: form.name.trim(),
      business: form.business,
      businessType: form.businessType,
      description: form.description.trim(),
      isActive: form.isActive,
    });
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* ======================================================
          BUSINESS
      ======================================================= */}

      <Select
        label="Business"
        hint="Select the business for this brand."
        options={businessOptions}
        value={form.business}
        error={errors.business}
        placeholder="Select business"
        onChange={(e) =>
          handleBusinessChange(e.target.value)
        }
      />

      {/* ======================================================
          BUSINESS TYPE
      ======================================================= */}

      <Select
        label="Business Type"
        hint={
          form.business
            ? "Select a business type from the selected business."
            : "First select a business."
        }
        options={businessTypeOptions}
        value={form.businessType}
        error={errors.businessType}
        placeholder="Select business type"
        disabled={!form.business}
        onChange={(e) =>
          handleBusinessTypeChange(e.target.value)
        }
      />

      {/* ======================================================
          BRAND NAME
      ======================================================= */}

      <Input
        label="Brand Name"
        placeholder="e.g. Samsung"
        value={form.name}
        error={errors.name}
        onChange={(e) =>
          setForm((current) => ({
            ...current,
            name: e.target.value,
          }))
        }
      />

      {/* ======================================================
          DESCRIPTION
      ======================================================= */}

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

      {/* ======================================================
          STATUS
      ======================================================= */}

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

      {/* ======================================================
          ACTIONS
      ======================================================= */}

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
            : "Create brand"}
        </Button>
      </div>
    </form>
  );
}