import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { listAllCopies } from "@/lib/labs/library/service";
import { copyUrl, publicOrigin, qrSvg } from "@/lib/labs/library/qr";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { PrintButton } from "@/components/labs/library/print-button";

export const metadata = { title: "QR labels" };

/** Printable QR labels: one per physical copy. */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ resource?: string }> }) {
  await requirePageUser(STAFF_ROLES, "/library/labels");
  const { dict } = await getDictionary();
  const b = dict.labs.library;
  const { resource } = await searchParams;
  const origin = await publicOrigin();
  const copies = listAllCopies().filter((c) => !resource || c.resourceId === resource);
  const labels = await Promise.all(copies.map(async (c) => ({ ...c, svg: await qrSvg(copyUrl(origin, c.code), 132) })));
  return (
    <PageContainer>
      <PageHeader title={b.labelsTitle} description={b.labelsLead} actions={<PrintButton label={dict.labs.common.print} />} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-2">
        {labels.map((c) => (
          <li key={c.id} className="flex break-inside-avoid flex-col items-center rounded-xl border border-dashed border-line-strong bg-white p-3 text-center text-ink">
            <div dangerouslySetInnerHTML={{ __html: c.svg }} aria-hidden />
            <p className="mt-1 font-mono text-sm font-semibold">{c.code}</p>
            <p className="line-clamp-2 text-xs">{c.title}</p>
            <p className="text-[11px] text-ink-subtle">{c.shelf}</p>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
