import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import { useCreateExpenseCategoryMutation } from "../../features/expense/expenseCategoryApi";
import { getApiErrorMessage } from "@/utils/apiError";

export default function CreateExpenseCategory() {
  const navigate = useNavigate();
  const [createCategory, { isLoading }] = useCreateExpenseCategoryMutation();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(form).unwrap();
      toast.success("Category created successfully");
      navigate("/expense-cat");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Expense Category" description="Create a new expense category." />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-primary bg-card p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-primary">Name *</label>
          <input name="name" required value={form.name} onChange={handleChange}
            className="h-10 w-full rounded-lg border border-primary bg-card px-3 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-primary">Description</label>
          <textarea name="description" rows={3} value={form.description} onChange={handleChange}
            className="w-full rounded-lg border border-primary bg-card px-3 py-2 text-sm" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          Active
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving…" : "Create Category"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/expense-cat")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}