import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { useVerifyOtpMutation, useForgotPasswordMutation } from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!email) {
    // Someone landed here directly without going through forgot-password.
    return (
      <div className="text-center">
        <p className="text-sm text-secondary">
          Please start from the forgot password page.
        </p>
        <Link to="/forgot-password" className="mt-3 inline-block text-sm font-medium text-[var(--action-primary)]">
          Go to Forgot Password
        </Link>
      </div>
    );
  }

  function handleChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the full 6-digit code");
      return;
    }

    try {
      const res = await verifyOtp({ email, otp }).unwrap();
      toast.success(res.message || "OTP verified");
      // Store only in sessionStorage, not persistent Redux state.
      sessionStorage.setItem("pos.resetToken", res.data.resetToken);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid or expired OTP"));
    }
  }

  async function handleResend() {
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("A new OTP has been sent");
      setCountdown(RESEND_SECONDS);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not resend OTP"));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">Verify OTP</h1>
        <p className="mt-1 text-sm text-secondary">
          Enter the 6-digit code sent to <span className="font-medium text-primary">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              className="h-12 w-11 rounded-lg border border-primary bg-card text-center text-lg font-semibold text-primary
                outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]"
            />
          ))}
        </div>

        <Button type="submit" loading={isLoading} icon={ShieldCheck} className="w-full">
          Verify OTP
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/login" className="flex items-center gap-1.5 text-secondary hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {countdown > 0 ? (
            <span className="text-secondary">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-[var(--action-primary)] hover:underline disabled:opacity-60"
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
