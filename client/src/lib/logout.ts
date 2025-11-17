export async function performLogout(clearAllSessions: () => Promise<void>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const isProd = window.location.hostname.endsWith("brevy.me");
    const base = isProd ? "https://cvfolio.onrender.com" : "";
    await fetch(`${base}/api/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("❌ [LOGOUT] Error during logout:", error);
  } finally {
    await clearAllSessions();
    window.location.href = "/";
  }
}


