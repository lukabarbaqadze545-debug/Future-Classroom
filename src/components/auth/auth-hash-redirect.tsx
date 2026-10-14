"use client";

import { useEffect } from "react";

/**
 * When the confirmation link's address is not on the project's list of
 * allowed redirect URLs, Supabase sends the person to its "Site URL" instead,
 * with the tokens (or the error) in the address. This sends them on to the
 * page that handles them, so a missing entry in the dashboard does not leave a
 * signed-up person staring at the home page.
 */
export function AuthHashRedirect() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname === "/auth/callback") return;
    if (/(^#|&)(access_token|error_code)=/.test(hash) || /[?&]token_hash=/.test(search)) {
      window.location.replace(`/auth/callback${search}${hash}`);
    }
  }, []);
  return null;
}
