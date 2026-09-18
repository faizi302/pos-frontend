import { useEffect, useState } from "react";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const DEFAULT_ACTION_OPTIONS = [
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "manage", label: "Manage" },
];

function normalizeResource(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, "");
}

export default function PermissionForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
  actionOptions = DEFAULT_ACTION_OPTIONS,
}) {
  const [form, setForm] = useState({
    resource: "",
    action: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  // =========================================================
  // LOAD INITIAL VALUES
  // =========================================================
  useEffect(() => {
    setForm({
      resource: initialValues?.resource || "",
      action: initialValues?.action || "",
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      isActive: initialValues?.isActive ?? true,
    });

    setErrors({});
  }, [initialValues]);

  // =========================================================
  // RESOURCE CHANGE
  // =========================================================
  function handleResourceChange(e) {
    const resource = normalizeResource(e.target.value);

    setForm((prev) => {
      const next = {
        ...prev,
        resource,
      };

      // Automatically generate permission name
      if (resource && prev.action) {
        next.name = `${resource}.${prev.action}`;
      } else {
        next.name = "";
      }

      return next;
    });

    // Clear resource error
    setErrors((prev) => ({
      ...prev,
      resource: "",
      name: "",
    }));
  }

  // =========================================================
  // ACTION CHANGE
  // =========================================================
  function handleActionChange(e) {
    const action = e.target.value;

    setForm((prev) => {
      const next = {
        ...prev,
        action,
      };

      // Automatically generate permission name
      if (prev.resource && action) {
        next.name = `${prev.resource}.${action}`;
      } else {
        next.name = "";
      }

      return next;
    });

    // Clear action error
    setErrors((prev) => ({
      ...prev,
      action: "",
      name: "",
    }));
  }

  // =========================================================
  // DESCRIPTION CHANGE
  // =========================================================
  function handleDescriptionChange(e) {
    setForm((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  }

  // =========================================================
  // VALIDATION
  // =========================================================
  function validate() {
    const next = {};

    if (!form.resource.trim()) {
      next.resource = "Resource is required";
    }

    if (!form.action.trim()) {
      next.action = "Action is required";
    }

    if (!form.name.trim()) {
      next.name = "Permission name is required";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  // =========================================================
  // SUBMIT
  // =========================================================
  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    const resource = normalizeResource(form.resource);
    const action = form.action.toLowerCase().trim();

    // Always generate the final permission name
    const permissionName =
      resource && action ? `${resource}.${action}` : form.name.trim();

    const payload = {
      resource,
      action,
      name: permissionName,
      description: form.description.trim(),
      isActive: form.isActive,
    };

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* =====================================================
          RESOURCE
      ====================================================== */}
      <Input
        label="Resource"
        placeholder="e.g. roles"
        hint="The entity this permission applies to."
        value={form.resource}
        onChange={handleResourceChange}
        error={errors.resource}
        required
      />

      {/* =====================================================
          ACTION DROPDOWN
      ====================================================== */}
      <Select
        label="Action"
        options={actionOptions}
        value={form.action}
        placeholder="Select an action"
        onChange={handleActionChange}
        error={errors.action}
        required
      />

      {/* =====================================================
          PERMISSION NAME
      ====================================================== */}
      <Input
        label="Permission Name"
        placeholder="e.g. roles.create"
        value={form.name}
        readOnly
        hint="Automatically generated from Resource + Action."
        error={errors.name}
        required
      />

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}
      <Textarea
        label="Description"
        placeholder="Optional description"
        value={form.description}
        onChange={handleDescriptionChange}
      />

      {/* =====================================================
          ACTIVE STATUS
      ====================================================== */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              isActive: e.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-gray-300"
        />

        <span className="text-sm font-medium">
          Active Permission
        </span>
      </label>

      {/* =====================================================
          ACTION BUTTONS
      ====================================================== */}
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" loading={submitting}>
          {initialValues ? "Save Changes" : "Create Permission"}
        </Button>
      </div>
    </form>
  );
}