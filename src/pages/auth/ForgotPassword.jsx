import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForgotPasswordMutation } from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError("");

    try {
      const res = await forgotPassword({ email }).unwrap();
      toast.success(res.message || "If that email exists, an OTP has been sent.");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send OTP"));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">Forgot password</h1>
        <p className="mt-1 text-sm text-secondary">
          Enter your account email and we'll send you a one-time code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@business.com"
          value={email}
          error={error}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" loading={isLoading} icon={Mail} className="w-full">
          Send OTP
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
