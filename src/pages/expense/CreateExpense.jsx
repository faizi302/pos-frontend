import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";

import { useCreateExpenseMutation } from "../../features/expense/expenseApi";
import { useGetExpenseCategoriesQuery } from "../../features/expense/expenseCategoryApi";
import { getApiErrorMessage } from "@/utils/apiError";

export default function CreateExpense() {
  const navigate = useNavigate();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  // =====================================================
  // CATEGORIES
  // =====================================================

  const { data: catData, isLoading: categoriesLoading } =
    useGetExpenseCategoriesQuery({ isActive: "true" });

  const categories = Array.isArray(catData?.categories)
    ? catData.categories
    : Array.isArray(catData)
    ? catData
    : [];

  // =====================================================
  // FORM STATE
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    amount: "",
    expenseCategory: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    status: "paid",
    description: "",
    notes: "",
    referenceNumber: "",
  });

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build clean payload – never send empty optional strings
    // (Joi rejects empty strings even when the field is optional)
    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      expenseCategory: form.expenseCategory,
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      status: form.status,
    };

    if (form.description?.trim()) {
      payload.description = form.description.trim();
    }

    if (form.notes?.trim()) {
      payload.notes = form.notes.trim();
    }

    if (form.referenceNumber?.trim()) {
      payload.referenceNumber = form.referenceNumber.trim();
    }

    try {
      await createExpense(payload).unwrap();
      toast.success("Expense created successfully");
      navigate("/expense");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Expense"
        description="Create a new business expense. Cash expenses will update the open cash register."
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-xl border border-primary bg-card p-6"
      >
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Shop Rent, Electricity Bill"
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Amount (PKR) <span className="text-red-500">*</span>
          </label>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="expenseCategory"
            required
            value={form.expenseCategory}
            onChange={handleChange}
            disabled={categoriesLoading}
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand disabled:opacity-60"
          >
            <option value="">
              {categoriesLoading ? "Loading categories…" : "Select category"}
            </option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {!categoriesLoading && categories.length === 0 && (
            <p className="mt-1.5 text-xs text-secondary">
              No active categories found. Create one first.
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Expense Date <span className="text-red-500">*</span>
          </label>
          <input
            name="expenseDate"
            type="date"
            required
            value={form.expenseDate}
            onChange={handleChange}
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Payment Method + Status (side by side on larger screens) */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
            {form.paymentMethod === "cash" && (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                This will be included in the open cash register.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
            >
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Reference Number
          </label>
          <input
            name="referenceNumber"
            value={form.referenceNumber}
            onChange={handleChange}
            placeholder="Optional – cheque / transaction reference"
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Optional details about this expense"
            className="w-full resize-none rounded-lg border border-primary bg-card px-3 py-2.5 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            value={form.notes}
            onChange={handleChange}
            placeholder="Internal notes (optional)"
            className="w-full resize-none rounded-lg border border-primary bg-card px-3 py-2.5 text-sm text-primary outline-none transition focus:border-brand"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-primary pt-5">
          <Button type="submit" disabled={isLoading || categoriesLoading}>
            {isLoading ? "Saving…" : "Create Expense"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/expense")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}