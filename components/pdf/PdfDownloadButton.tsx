"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { ResumeData } from "@/lib/schema";
import { Loader2, FileDown } from "lucide-react";
import { ResumePdfDocument } from "@/components/pdf/ResumePdfDocument";
import { ResumeClassicDocument } from "@/components/pdf/ResumeClassicDocument";
import { ResumeExecutiveDocument } from "@/components/pdf/ResumeExecutiveDocument";

export type PdfTemplate = "sidebar" | "classic" | "executive";

interface Props {
  data: ResumeData;
  template?: PdfTemplate;
  className?: string;
  label?: string;
}

function DocumentComponent({ data, template }: { data: ResumeData; template: PdfTemplate }) {
  if (template === "classic") return <ResumeClassicDocument data={data} />;
  if (template === "executive") return <ResumeExecutiveDocument data={data} />;
  return <ResumePdfDocument data={data} />;
}

export function PdfDownloadButton({ data, template = "sidebar", className, label }: Props) {
  const filename = `${(data.personalInfo.fullName || "Resume").replace(/\s+/g, "_")}_resume.pdf`;

  return (
    <PDFDownloadLink
      document={<DocumentComponent data={data} template={template} />}
      fileName={filename}
      className={className}
    >
      {({ loading }: { loading: boolean }) =>
        loading ? (
          <span className="flex items-center gap-2 cursor-wait opacity-70">
            <Loader2 className="w-4 h-4 animate-spin" />
            {label || "Building PDF..."}
          </span>
        ) : (
          <span className="flex items-center gap-2 cursor-pointer">
            <FileDown className="w-4 h-4" />
            {label || "Export PDF"}
          </span>
        )
      }
    </PDFDownloadLink>
  );
}
