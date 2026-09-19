import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";

const EMPTY_FORM = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  country: "",
  openingBalance: "",
  creditLimit: "",
  notes: "",
};

export default function CustomerForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [errors, setErrors] =
    useState({});

  // =====================================================
  // INITIAL VALUES
  // =====================================================

  useEffect(() => {
    if (!initialValues) {
      setForm(EMPTY_FORM);
      setErrors({});
      return;
    }

    setForm({
      name:
        initialValues?.name || "",

      phone:
        initialValues?.phone || "",

      alternatePhone:
        initialValues?.alternatePhone || "",

      email:
        initialValues?.email || "",

      address:
        initialValues?.address || "",

      city:
        initialValues?.city || "",

      country:
        initialValues?.country || "",

      openingBalance:
        initialValues?.openingBalance ??
        "",

      creditLimit:
        initialValues?.creditLimit ??
        "",

      notes:
        initialValues?.notes || "",
    });

    setErrors({});
  }, [initialValues]);

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Remove field error after user starts editing it
    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  }

  // =====================================================
  // CLIENT VALIDATION
  //
  // Backend Joi validation remains the final validation.
  // =====================================================

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name =
        "Customer name is required.";
    }

    if (form.email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          form.email.trim()
        )
      ) {
        nextErrors.email =
          "Enter a valid email address.";
      }
    }

    if (
      form.openingBalance !== "" &&
      Number.isNaN(
        Number(form.openingBalance)
      )
    ) {
      nextErrors.openingBalance =
        "Enter a valid amount.";
    }

    if (
      form.creditLimit !== "" &&
      Number.isNaN(
        Number(form.creditLimit)
      )
    ) {
      nextErrors.creditLimit =
        "Enter a valid amount.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const body = {
      name: form.name.trim(),

      phone:
        form.phone.trim() || undefined,

      alternatePhone:
        form.alternatePhone.trim() ||
        undefined,

      email:
        form.email.trim() || undefined,

      address:
        form.address.trim() || undefined,

      city:
        form.city.trim() || undefined,

      country:
        form.country.trim() || undefined,

      openingBalance:
        form.openingBalance === ""
          ? 0
          : Number(
              form.openingBalance
            ),

      creditLimit:
        form.creditLimit === ""
          ? 0
          : Number(
              form.creditLimit
            ),

      notes:
        form.notes.trim() || undefined,
    };

    await onSubmit(body);
  }

  // =====================================================
  // FIELD CLASS
  // =====================================================

  function inputClass(name) {
    return `
      w-full rounded-lg border
      bg-card
      px-3 py-2.5
      text-sm text-primary
      outline-none
      transition
      placeholder:text-secondary
      focus:border-brand
      focus:ring-2
      focus:ring-brand/10
      ${
        errors[name]
          ? "border-red-500"
          : "border-primary"
      }
    `;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* =================================================
          BASIC INFORMATION
      ================================================= */}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-primary">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* NAME */}

          <div className="sm:col-span-2">
            <label
              htmlFor="customer-name"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Customer Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="customer-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={inputClass(
                "name"
              )}
              disabled={submitting}
              autoComplete="name"
            />

            {errors.name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* PHONE */}

          <div>
            <label
              htmlFor="customer-phone"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Phone
            </label>

            <input
              id="customer-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="03001234567"
              className={inputClass(
                "phone"
              )}
              disabled={submitting}
              autoComplete="tel"
            />

            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone}
              </p>
            )}
          </div>

          {/* ALTERNATE PHONE */}

          <div>
            <label
              htmlFor="customer-alternate-phone"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Alternate Phone
            </label>

            <input
              id="customer-alternate-phone"
              name="alternatePhone"
              type="tel"
              value={
                form.alternatePhone
              }
              onChange={handleChange}
              placeholder="Optional"
              className={inputClass(
                "alternatePhone"
              )}
              disabled={submitting}
              autoComplete="tel"
            />
          </div>

          {/* EMAIL */}

          <div className="sm:col-span-2">
            <label
              htmlFor="customer-email"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Email
            </label>

            <input
              id="customer-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="customer@example.com"
              className={inputClass(
                "email"
              )}
              disabled={submitting}
              autoComplete="email"
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          ADDRESS
      ================================================= */}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-primary">
          Address Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ADDRESS */}

          <div className="sm:col-span-2">
            <label
              htmlFor="customer-address"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Address
            </label>

            <textarea
              id="customer-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter customer address"
              rows={3}
              className={`${inputClass(
                "address"
              )} resize-none`}
              disabled={submitting}
              autoComplete="street-address"
            />
          </div>

          {/* CITY */}

          <div>
            <label
              htmlFor="customer-city"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              City
            </label>

            <input
              id="customer-city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="Lahore"
              className={inputClass(
                "city"
              )}
              disabled={submitting}
              autoComplete="address-level2"
            />
          </div>

          {/* COUNTRY */}

          <div>
            <label
              htmlFor="customer-country"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Country
            </label>

            <input
              id="customer-country"
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              placeholder="Pakistan"
              className={inputClass(
                "country"
              )}
              disabled={submitting}
              autoComplete="country-name"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          ACCOUNT INFORMATION
      ================================================= */}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-primary">
          Account Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* OPENING BALANCE */}

          <div>
            <label
              htmlFor="customer-opening-balance"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Opening Balance
            </label>

            <input
              id="customer-opening-balance"
              name="openingBalance"
              type="number"
              min="0"
              step="0.01"
              value={
                form.openingBalance
              }
              onChange={handleChange}
              placeholder="0"
              className={inputClass(
                "openingBalance"
              )}
              disabled={submitting}
            />

            {errors.openingBalance && (
              <p className="mt-1 text-xs text-red-500">
                {
                  errors.openingBalance
                }
              </p>
            )}
          </div>

          {/* CREDIT LIMIT */}

          <div>
            <label
              htmlFor="customer-credit-limit"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Credit Limit
            </label>

            <input
              id="customer-credit-limit"
              name="creditLimit"
              type="number"
              min="0"
              step="0.01"
              value={
                form.creditLimit
              }
              onChange={handleChange}
              placeholder="0"
              className={inputClass(
                "creditLimit"
              )}
              disabled={submitting}
            />

            {errors.creditLimit && (
              <p className="mt-1 text-xs text-red-500">
                {errors.creditLimit}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      <div>
        <label
          htmlFor="customer-notes"
          className="mb-1.5 block text-sm font-medium text-primary"
        >
          Notes
        </label>

        <textarea
          id="customer-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          rows={3}
          className={`${inputClass(
            "notes"
          )} resize-none`}
          disabled={submitting}
        />
      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="flex flex-col-reverse gap-2 border-t border-secondary pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={submitting}
          disabled={submitting}
        >
          {initialValues
            ? "Update Customer"
            : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}