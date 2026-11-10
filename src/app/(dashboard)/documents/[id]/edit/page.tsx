import { DocumentEditor } from "@/components/documents/document-editor";
import { getDocumentById } from "@/services/documents/document-service";
import { notFound } from "next/navigation";

export default async function EditDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getDocumentById(params.id);

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <DocumentEditor initialData={doc} />
    </div>
  );
}
