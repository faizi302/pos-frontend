import { useEffect, useState } from "react";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

export default function BrandForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
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

  function validate() {
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = "Brand name is required";
    else if (name.length < 2) next.name = "Brand name must be at least 2 characters";
    else if (name.length > 100) next.name = "Brand name cannot exceed 100 characters";
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
      description: form.description.trim(),
      isActive: Boolean(form.isActive),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Brand name"
        placeholder="e.g. Samsung"
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
        Business and business type are taken from your account. You only need to
        enter the brand name.
      </p>

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialValues ? "Save changes" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}