
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { useLoginMutation } from "@/features/auth/authApi";
import { setCurrentUser } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/utils/apiError";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  function validate() {
    const next = {};

    if (!form.email.trim()) {
      next.email = "Email is required";
    }

    if (!form.password) {
      next.password = "Password is required";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    try {
      const res = await login(form).unwrap();

      dispatch(setCurrentUser(res.user));

      toast.success(res.message || "Welcome back!");

      const redirectTo =
        location.state?.from?.pathname || "/dashboard";

      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Invalid credentials")
      );
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">
          Welcome back
        </h1>

        <p className="mt-1 text-sm text-secondary">
          Sign in to your POS SaaS account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          value={form.email}
          error={errors.email}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              email: e.target.value,
            }))
          }
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          error={errors.password}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              password: e.target.value,
            }))
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-primary accent-[var(--action-primary)]"
            />

            Remember me
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-[var(--action-primary)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          icon={LogIn}
          className="mt-2 w-full"
        >
          Sign in
        </Button>

        {/* Registration Link */}
        <div className="pt-2 text-center">
          <p className="text-sm text-secondary">
            Don't have an account yet?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[var(--action-primary)] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
