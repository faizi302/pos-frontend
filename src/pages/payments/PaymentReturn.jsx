import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, X } from "lucide-react";

import { useCapturePaymentMutation } from "@/features/payments/paymentApi";

// =====================================================
// Landing page for all three gateways after checkout:
//
// - PayPal: redirected here by PayPal itself with ?gateway=paypal (plus
//   PayPal's own `token`/`PayerID` params, which we don't need). The actual
//   payment id was stashed in sessionStorage before the redirect (Pos.jsx),
//   because PayPal's return_url is fixed at order-creation time and can't
//   carry our Mongo _id. We call capturePayment(paymentId) here.
//
// - JazzCash / EasyPaisa: the backend already verified the hash and
//   completed/failed the payment server-side (see paymentController.js
//   jazzcashReturn/easypaisaReturn) before 302-redirecting here — this page
//   just reads the ?paymentId & ?status query params it was given and shows
//   the result. No further API call needed.
// =====================================================

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gateway = searchParams.get("gateway");
  const statusParam = searchParams.get("status");
  const paymentIdParam = searchParams.get("paymentId");

  const [capturePayment] = useCapturePaymentMutation();
  const [state, setState] = useState({ loading: true, success: false, message: "" });

  useEffect(() => {
    const run = async () => {
      if (gateway === "paypal") {
        const paymentId = sessionStorage.getItem("pos_pending_payment_id");

        if (!paymentId) {
          setState({ loading: false, success: false, message: "No pending PayPal payment found." });
          return;
        }

        try {
          const result = await capturePayment(paymentId).unwrap();

          sessionStorage.removeItem("pos_pending_payment_id");
          sessionStorage.removeItem("pos_pending_gateway");

          if (result?.success || result?.alreadyCompleted) {
            setState({ loading: false, success: true, message: "Payment completed successfully." });
          } else if (result?.pending) {
            setState({ loading: false, success: false, message: "Payment is still pending confirmation." });
          } else {
            setState({ loading: false, success: false, message: "PayPal did not confirm this payment." });
          }
        } catch (error) {
          setState({
            loading: false,
            success: false,
            message: error?.data?.message || error?.message || "Failed to capture PayPal payment.",
          });
        }
        return;
      }

      // JazzCash / EasyPaisa — already resolved server-side.
      if (statusParam === "completed") {
        setState({ loading: false, success: true, message: "Payment completed successfully." });
      } else if (statusParam === "error") {
        setState({ loading: false, success: false, message: "Something went wrong verifying this payment." });
      } else {
        setState({ loading: false, success: false, message: "Payment was not completed." });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-2xl border border-primary bg-card p-6 text-center shadow-xl">
        {state.loading ? (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-brand" />
            <h2 className="mt-4 text-base font-bold text-primary">Confirming payment...</h2>
            <p className="mt-1 text-xs text-secondary">Please don't close this page.</p>
          </>
        ) : (
          <>
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                state.success
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              }`}
            >
              {state.success ? <Check size={28} /> : <X size={28} />}
            </div>
            <h2 className="mt-4 text-base font-bold text-primary">
              {state.success ? "Payment Successful" : "Payment Not Completed"}
            </h2>
            <p className="mt-1 text-xs text-secondary">{state.message}</p>
            {paymentIdParam && <p className="mt-1 text-[10px] text-secondary">Reference: {paymentIdParam}</p>}

            <button
              type="button"
              onClick={() => navigate("/pos")}
              className="mt-5 h-10 w-full rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover"
            >
              Back to POS
            </button>
          </>
        )}
      </div>
    </div>
  );
}