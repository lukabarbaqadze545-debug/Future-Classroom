import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/**
 * QR codes are generated on the server as SVG from our own URLs, so they
 * print sharply and need no external service.
 */
export async function qrSvg(text: string, size = 160): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", width: size, color: { dark: "#0f172a", light: "#ffffff" } });
}

/** The address printed in QR codes: PUBLIC_BASE_URL if set, else the current host. */
export async function publicOrigin(): Promise<string> {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  // Classroom servers usually run plain HTTP on the school network; a TLS
  // proxy in front sets x-forwarded-proto. Set PUBLIC_BASE_URL to be sure.
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  return `${proto}://${host}`;
}

export function copyUrl(origin: string, code: string) {
  return `${origin}/library/qr/${encodeURIComponent(code)}`;
}
