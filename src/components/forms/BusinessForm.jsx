import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const emptyForm = { name: "", isActive: true };

export default function BusinessForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialValues ? { name: initialValues.name, isActive: initialValues.isActive } : emptyForm);
  }, [initialValues]);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Business name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Business Name"
        placeholder="e.g. Information Technology"
        value={form.name}
        error={errors.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          {initialValues ? "Save changes" : "Create business"}
        </Button>
      </div>
    </form>
  );
}
