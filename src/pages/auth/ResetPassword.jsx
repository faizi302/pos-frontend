import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { useResetPasswordMutation } from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const resetToken = sessionStorage.getItem("pos.resetToken");

  if (!resetToken) {
    return (
      <div className="text-center">
        <p className="text-sm text-secondary">
          Your reset session has expired. Please request a new OTP.
        </p>
        <Link to="/forgot-password" className="mt-3 inline-block text-sm font-medium text-[var(--action-primary)]">
          Go to Forgot Password
        </Link>
      </div>
    );
  }

  function validate() {
    const next = {};
    if (!form.password || form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await resetPassword({
        resetToken,
        password: form.password,
      }).unwrap();

      sessionStorage.removeItem("pos.resetToken");
      toast.success(res.message || "Password reset successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not reset password"));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">Reset password</h1>
        <p className="mt-1 text-sm text-secondary">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          label="New password"
          placeholder="••••••••"
          value={form.password}
          error={errors.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="••••••••"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
        />

        <Button type="submit" loading={isLoading} icon={KeyRound} className="w-full">
          Reset password
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </form>
    </div>
  );
}
