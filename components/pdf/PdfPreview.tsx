"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { ResumeData } from "@/lib/schema";
import { PdfTemplate } from "@/components/pdf/PdfDownloadButton";
import { ResumePdfDocument } from "@/components/pdf/ResumePdfDocument";
import { ResumeClassicDocument } from "@/components/pdf/ResumeClassicDocument";
import { ResumeExecutiveDocument } from "@/components/pdf/ResumeExecutiveDocument";

interface Props {
  data: ResumeData;
  template?: PdfTemplate;
}

function DocumentComponent({ data, template }: { data: ResumeData; template: PdfTemplate }) {
  if (template === "classic") return <ResumeClassicDocument data={data} />;
  if (template === "executive") return <ResumeExecutiveDocument data={data} />;
  return <ResumePdfDocument data={data} />;
}

export function PdfPreview({ data, template = "sidebar" }: Props) {
  return (
    <PDFViewer
      width="100%"
      height="100%"
      style={{ border: "none", borderRadius: "0.5rem" }}
      showToolbar={false}
    >
      <DocumentComponent data={data} template={template} />
    </PDFViewer>
  );
}
