import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";

const emptyForm = { name: "", business: "", description: "", isActive: true };

export default function BusinessTypeForm({ initialValues, onSubmit, onCancel, submitting }) {
  const { data: businesses, isLoading: businessesLoading } = useGetBusinessesQuery();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(
      initialValues
        ? {
            name: initialValues.name,
            business: initialValues.business?._id || initialValues.business || "",
            description: initialValues.description || "",
            isActive: initialValues.isActive,
          }
        : emptyForm
    );
  }, [initialValues]);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.business) next.business = "Business is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  const businessOptions = (businesses || [])
    .filter((b) => b.isActive || b._id === form.business)
    .map((b) => ({ value: b._id, label: b.name }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        label="Business"
        options={businessOptions}
        value={form.business}
        error={errors.business}
        disabled={businessesLoading}
        onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))}
      />

      <Input
        label="Name"
        placeholder="e.g. Mobiles"
        value={form.name}
        error={errors.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />

      <Textarea
        label="Description"
        placeholder="Optional description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <label className="flex items-center gap-2 text-sm text-primary">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-primary accent-[var(--action-primary)]"
        />
        Active
      </label>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialValues ? "Save changes" : "Create business type"}
        </Button>
      </div>
    </form>
  );
}
