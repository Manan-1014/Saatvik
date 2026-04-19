import Razorpay from "razorpay";

/**
 * Razorpay SDK instance — secrets stay on the server only.
 * Keys are read from the environment at startup.
 */
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  // Lazy throw at payment time keeps the API bootable for environments without Razorpay.
  console.warn("[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment routes will fail until configured.");
}

export function getRazorpayClient(): Razorpay {
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getRazorpayKeyId(): string {
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not set");
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not set");
  }
  return keySecret;
}

/**
 * Safe fields for logs when Razorpay calls fail (never includes secret value).
 */
export function getRazorpayEnvDiagnosticsForLog(): {
  keyIdSet: boolean;
  keyIdLength: number;
  keyIdPrefix: string;
  /** Last 4 chars of Key Id — compare with Razorpay Dashboard (key id is public). */
  keyIdSuffix: string;
  keyIdHasLeadingOrTrailingSpace: boolean;
  keyMode: "test" | "live" | "unknown";
  secretSet: boolean;
  secretLength: number;
  secretHasLeadingOrTrailingSpace: boolean;
} {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const idTrim = id.trim();
  const secretTrim = secret.trim();
  return {
    keyIdSet: id.length > 0,
    keyIdLength: id.length,
    keyIdPrefix: idTrim.slice(0, 14),
    keyIdSuffix: idTrim.length >= 4 ? idTrim.slice(-4) : "",
    keyIdHasLeadingOrTrailingSpace: id.length > 0 && id !== idTrim,
    keyMode: idTrim.startsWith("rzp_test_") ? "test" : idTrim.startsWith("rzp_live_") ? "live" : "unknown",
    secretSet: secret.length > 0,
    secretLength: secret.length,
    secretHasLeadingOrTrailingSpace: secret.length > 0 && secret !== secretTrim,
  };
}
