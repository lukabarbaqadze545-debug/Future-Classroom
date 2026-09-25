import { redirect } from "next/navigation";

/** The library moved to /library; "Ask the library" is one of its tabs. */
export default async function LegacyLibraryPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  redirect(subject ? `/library?subject=${encodeURIComponent(subject)}#ask` : "/library#ask");
}
