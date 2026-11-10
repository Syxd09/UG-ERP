import { DocumentEditor } from "@/components/documents/document-editor";
import { AppShell } from "@/components/layout/app-shell";

export default function NewDocumentPage({
  searchParams,
}: {
  searchParams: { type?: string; customerId?: string };
}) {
  const docType =
    searchParams.type === "TAX_INVOICE"
      ? "TAX_INVOICE"
      : searchParams.type === "PROFORMA_INVOICE"
      ? "PROFORMA_INVOICE"
      : "QUOTATION";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <DocumentEditor
        defaultDocType={docType}
        preselectedCustomerId={searchParams.customerId}
      />
    </div>
  );
}

