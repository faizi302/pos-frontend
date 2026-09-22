import { useEffect, useMemo, useState } from "react";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

import { useGetBrandsQuery } from "@/features/brands/brandsApi";

const emptyForm = {
  name: "",
  brand: "",
  description: "",
  isActive: true,
};

const asList = (data) => (Array.isArray(data) ? data : []);

export default function ModelForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}) {
  const { data: brandsData, isLoading: brandsLoading } = useGetBrandsQuery({
    isActive: "true",
  });
  const brands = asList(brandsData);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      const brandId =
        initialValues.brand?._id || initialValues.brand || "";
      setForm({
        name: initialValues.name || "",
        brand: brandId,
        description: initialValues.description || "",
        isActive:
          initialValues.isActive !== undefined
            ? Boolean(initialValues.isActive)
            : true,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialValues]);

  const brandOptions = useMemo(
    () =>
      brands
        .filter((b) => b.isActive !== false)
        .map((b) => ({ value: b._id, label: b.name })),
    [brands]
  );

  function validate() {
    const next = {};
    if (!form.brand) next.brand = "Brand is required";
    const name = form.name.trim();
    if (!name) next.name = "Model name is required";
    else if (name.length > 150) next.name = "Model name cannot exceed 150 characters";
    if (form.description && form.description.length > 500) {
      next.description = "Description cannot exceed 500 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      brand: form.brand,
      description: form.description.trim(),
      isActive: Boolean(form.isActive),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        label="Brand"
        hint="Only brands in your business are listed."
        options={brandOptions}
        value={form.brand}
        error={errors.brand}
        placeholder={brandsLoading ? "Loading brands…" : "Select brand"}
        disabled={brandsLoading || submitting}
        required
        onChange={(e) => {
          setForm((f) => ({ ...f, brand: e.target.value }));
          if (errors.brand) setErrors((x) => ({ ...x, brand: "" }));
        }}
      />

      <Input
        label="Model name"
        placeholder="e.g. Galaxy S20"
        value={form.name}
        error={errors.name}
        required
        onChange={(e) => {
          setForm((f) => ({ ...f, name: e.target.value }));
          if (errors.name) setErrors((x) => ({ ...x, name: "" }));
        }}
      />

      <Textarea
        label="Description"
        placeholder="Optional description"
        value={form.description}
        error={errors.description}
        onChange={(e) => {
          setForm((f) => ({ ...f, description: e.target.value }));
          if (errors.description) setErrors((x) => ({ ...x, description: "" }));
        }}
      />

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-primary">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) =>
            setForm((f) => ({ ...f, isActive: e.target.checked }))
          }
          className="h-4 w-4 rounded border-primary accent-[var(--action-primary)]"
        />
        <span>Active</span>
      </label>

      <p className="rounded-xl border border-secondary bg-surface px-3 py-2 text-xs text-secondary">
        Tenant, business, and business type are assigned from your account. The
        selected brand must belong to the same tenant.
      </p>

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialValues ? "Save changes" : "Create model"}
        </Button>
      </div>
    </form>
  );
}