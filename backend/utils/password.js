const axios = require("axios");

/**
 * Check if an email address likely exists using a third-party API.
 * Supports providers like Abstract, Hunter, MailboxLayer, ZeroBounce via ENV configuration.
 *
 * Configure with:
 *   EMAIL_VERIFICATION_API_URL
 *   EMAIL_VERIFICATION_API_KEY
 *   EMAIL_VERIFICATION_METHOD (optional for different response shapes)
 */
async function checkEmailExists(email) {
  const apiUrl = process.env.EMAIL_VERIFICATION_API_URL;
  const apiKey = process.env.EMAIL_VERIFICATION_API_KEY;
  if (!apiUrl || !apiKey) {
    // Fail-open to avoid blocking signups in dev; caller can treat as unknown
    return true;
  }

  try {
    // Generic GET with api_key and email query. Many providers follow this pattern.
    const res = await axios.get(apiUrl, {
      params: { api_key: apiKey, email },
      timeout: 8000,
    });

    const method = (
      process.env.EMAIL_VERIFICATION_METHOD || "generic"
    ).toLowerCase();
    switch (method) {
      case "abstract": {
        const d = res.data || {};
        const strict =
          String(
            process.env.EMAIL_VERIFICATION_STRICT || "false"
          ).toLowerCase() === "true";
        // If explicit invalid format
        if (
          typeof d?.is_valid_format?.value !== "undefined" &&
          !d.is_valid_format.value
        ) {
          return false;
        }
        // Strongest: SMTP validity
        if (typeof d?.is_smtp_valid?.value !== "undefined") {
          return Boolean(d.is_smtp_valid.value);
        }
        // Next: explicit deliverability
        if (typeof d?.deliverability !== "undefined") {
          return d.deliverability === "DELIVERABLE";
        }
        // Next: MX record present
        if (typeof d?.is_mx_found?.value !== "undefined") {
          if (d.is_mx_found.value) return true;
          return strict ? false : false;
        }
        // Reputation score (0..1). Accept with moderate threshold unless strict
        if (typeof d?.score !== "undefined") {
          const threshold = strict ? 0.7 : 0.3;
          return Number(d.score) >= threshold;
        }
        // Unknown shape: in non-strict mode, allow; in strict, reject
        return strict ? false : true;
      }
      case "mailboxlayer":
        // mailboxlayer: {format_valid, smtp_check, score}
        return Boolean(res.data?.smtp_check);
      case "hunter":
        // Hunter: {data: {status: "valid"|"invalid"|...}}
        return res.data?.data?.status === "valid";
      case "zerobounce":
        // ZeroBounce: {status: "valid"|"invalid"}
        return res.data?.status === "valid";
      case "generic":
      default:
        // Try to infer common flags
        if (typeof res.data?.smtp_check !== "undefined")
          return Boolean(res.data.smtp_check);
        if (typeof res.data?.deliverable !== "undefined")
          return Boolean(res.data.deliverable);
        if (typeof res.data?.is_valid !== "undefined")
          return Boolean(res.data.is_valid);
        return true; // Unknown shape, fail-open
    }
  } catch (err) {
    console.error("Email verification API error:", err.message);
    // Fail-open to avoid blocking; frontend still requires email link verification
    return true;
  }
}

module.exports = { checkEmailExists };
