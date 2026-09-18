import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useGetPermissionsQuery } from "@/features/permissions/permissionsApi";

const emptyForm = { name: "", slug: "", description: "", permissions: [], isActive: true };

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function RoleForm({ initialValues, onSubmit, onCancel, submitting }) {
  const { data: permissions, isLoading: permissionsLoading } = useGetPermissionsQuery();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    setForm(
      initialValues
        ? {
            name: initialValues.name,
            slug: initialValues.slug,
            description: initialValues.description || "",
            permissions: (initialValues.permissions || []).map((p) => (typeof p === "string" ? p : p._id)),
            isActive: initialValues.isActive,
          }
        : emptyForm
    );
    setSlugTouched(Boolean(initialValues));
  }, [initialValues]);

  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce((groups, p) => {
      const key = p.resource;
      groups[key] = groups[key] || [];
      groups[key].push(p);
      return groups;
    }, {});
  }, [permissions]);

  function handleNameChange(value) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function togglePermission(id) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }));
  }

  function toggleGroup(resourcePermissions) {
    const ids = resourcePermissions.map((p) => p._id);
    const allSelected = ids.every((id) => form.permissions.includes(id));
    setForm((f) => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter((id) => !ids.includes(id))
        : [...new Set([...f.permissions, ...ids])],
    }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Role name is required";
    if (!form.slug.trim()) next.slug = "Role slug is required";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Role Name"
          placeholder="e.g. Store Manager"
          value={form.name}
          error={errors.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        <Input
          label="Slug"
          placeholder="e.g. store-manager"
          value={form.slug}
          error={errors.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Optional description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-primary">Permissions</p>
        {permissionsLoading ? (
          <p className="text-sm text-secondary">Loading permissions...</p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-primary p-3">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="mb-3 last:mb-0">
                <label className="flex items-center gap-2 text-sm font-semibold capitalize text-primary">
                  <input
                    type="checkbox"
                    checked={perms.every((p) => form.permissions.includes(p._id))}
                    onChange={() => toggleGroup(perms)}
                    className="h-4 w-4 rounded border-primary accent-[var(--action-primary)]"
                  />
                  {resource}
                </label>
                <div className="mt-1.5 ml-6 flex flex-wrap gap-x-4 gap-y-1">
                  {perms.map((p) => (
                    <label key={p._id} className="flex items-center gap-1.5 text-sm text-secondary">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p._id)}
                        onChange={() => togglePermission(p._id)}
                        className="h-3.5 w-3.5 rounded border-primary accent-[var(--action-primary)]"
                      />
                      {p.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
          {initialValues ? "Save changes" : "Create role"}
        </Button>
      </div>
    </form>
  );
}
