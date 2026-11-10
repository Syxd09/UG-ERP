import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportDocumentToPdf(
  elementIdOrElement: string | HTMLElement,
  filename: string = "invoice.pdf"
): Promise<void> {
  const element =
    typeof elementIdOrElement === "string"
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    throw new Error("Target element for PDF export not found");
  }

  // Clone element into an isolated offscreen container with exact 210mm width (794px at 96 DPI)
  // This completely eliminates any CSS transforms, scroll offsets, or zoom scaling on the active page
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = "ug-pdf-export-clone";
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.width = "794px"; // 210mm at 96 DPI
  clone.style.minHeight = "1123px"; // 297mm at 96 DPI
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.zIndex = "-9999";
  clone.style.background = "#ffffff";
  document.body.appendChild(clone);

  try {
    // High-resolution canvas capture at 2.5x scale
    const canvas = await html2canvas(clone, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      windowWidth: 794,
      windowHeight: clone.scrollHeight || 1123,
    });

    const imgData = canvas.toDataURL("image/png");

    // Standard A4 dimensions in millimeters
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    // Add subsequent pages if invoice content spans multiple pages
    while (heightLeft > 4) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } finally {
    clone.remove();
  }
}
