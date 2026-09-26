import "server-only";
import os from "node:os";
import { headers } from "next/headers";
import QRCode from "qrcode";

/**
 * QR codes are generated on the server as SVG from our own URLs, so they
 * print sharply and need no external service.
 */
export async function qrSvg(text: string, size = 160): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", width: size, color: { dark: "#0f172a", light: "#ffffff" } });
}

/** This computer's address on the school network (private IPv4), if it has one. */
export function lanAddress(): string | null {
  const candidates = Object.values(os.networkInterfaces())
    .flat()
    .filter((a): a is os.NetworkInterfaceInfo => Boolean(a && a.family === "IPv4" && !a.internal))
    .map((a) => a.address);
  const rank = (ip: string) => (ip.startsWith("192.168.") ? 0 : ip.startsWith("10.") ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3);
  return candidates.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/**
 * The address other computers use to reach this server — printed in QR codes,
 * on account slips and on the projector's "join" screen: PUBLIC_BASE_URL if
 * set, else the current host. A teacher who opened the site on the server
 * itself sees "localhost", which students cannot use, so it is replaced by
 * the server's network address.
 */
export async function publicOrigin(): Promise<string> {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  let host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const [hostname, port] = host.startsWith("[") ? [host.slice(0, host.indexOf("]") + 1), host.slice(host.indexOf("]") + 2)] : host.split(":");
  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) {
    const lan = lanAddress();
    if (lan) host = port ? `${lan}:${port}` : lan;
  }
  // Classroom servers usually run plain HTTP on the school network; a TLS
  // proxy in front sets x-forwarded-proto. Set PUBLIC_BASE_URL to be sure.
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  return `${proto}://${host}`;
}

/** What students type to join a lesson, e.g. "192.168.1.10:3000/join". */
export async function joinAddress(): Promise<string> {
  return `${(await publicOrigin()).replace(/^https?:\/\//, "")}/join`;
}

export function copyUrl(origin: string, code: string) {
  return `${origin}/library/qr/${encodeURIComponent(code)}`;
}
