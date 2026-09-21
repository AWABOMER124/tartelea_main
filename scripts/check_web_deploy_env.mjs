const errors = [];

const apiBase = process.env.VITE_BACKEND_API_BASE_URL?.trim() || "";
const livekitUrl = process.env.VITE_LIVEKIT_URL?.trim() || "";
const backendCommunity = process.env.VITE_USE_BACKEND_COMMUNITY?.trim() || "true";

if (!apiBase) {
  errors.push("VITE_BACKEND_API_BASE_URL is required.");
} else {
  try {
    const url = new URL(apiBase);
    if (url.protocol !== "https:") {
      errors.push("VITE_BACKEND_API_BASE_URL must use https:// for production.");
    }
    if (!url.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
      errors.push("VITE_BACKEND_API_BASE_URL must point to the /api/v1 base path.");
    }
  } catch {
    errors.push("VITE_BACKEND_API_BASE_URL must be a valid absolute URL.");
  }
}

if (!livekitUrl) {
  errors.push("VITE_LIVEKIT_URL is required.");
} else {
  try {
    const url = new URL(livekitUrl);
    if (url.protocol !== "wss:") {
      errors.push("VITE_LIVEKIT_URL must use wss:// for production.");
    }
  } catch {
    errors.push("VITE_LIVEKIT_URL must be a valid URL.");
  }
}

if (!["true", "false"].includes(backendCommunity)) {
  errors.push("VITE_USE_BACKEND_COMMUNITY must be true or false.");
}

if (errors.length) {
  console.error("[WEB PREFLIGHT] invalid production build configuration:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[WEB PREFLIGHT] production build configuration is valid.");
console.log(`[WEB PREFLIGHT] API: ${apiBase}`);
console.log(`[WEB PREFLIGHT] LiveKit: ${livekitUrl}`);
