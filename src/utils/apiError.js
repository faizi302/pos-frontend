// Backend error responses look like: { success: false, message: "..." }
// This pulls that message out (or falls back to something generic),
// and also supports the validation-array shape used by some controllers.
export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.data;

  if (!data) return error?.error || fallback;

  if (Array.isArray(data.message)) {
    return data.message[0] || fallback;
  }

  return data.message || fallback;
}
