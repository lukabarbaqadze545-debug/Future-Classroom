import { notFound, redirect } from "next/navigation";
import { findCopyByCode } from "@/lib/labs/library/service";

/** Scanning a shelf copy's QR code lands here and opens the book's page. */
export default async function QrPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const copy = findCopyByCode(decodeURIComponent(code));
  if (!copy) notFound();
  redirect(`/library/${copy.resourceId}?copy=${encodeURIComponent(copy.code)}`);
}
