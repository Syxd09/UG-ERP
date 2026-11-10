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

  // Find all individual A4 sheets inside the container
  const sheetNodes = Array.from(element.querySelectorAll<HTMLElement>(".a4-sheet"));
  const sheets = sheetNodes.length > 0 ? sheetNodes : [element as HTMLElement];

  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];

    // Clone individual sheet into isolated offscreen container with exact 210mm width (794px at 96 DPI)
    const clone = sheet.cloneNode(true) as HTMLElement;
    clone.id = `ug-pdf-export-clone-${i}`;
    clone.style.transform = "none";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.width = "794px"; // 210mm at 96 DPI
    clone.style.height = "1123px"; // 297mm at 96 DPI
    clone.style.minHeight = "1123px";
    clone.style.maxHeight = "1123px";
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.zIndex = "-9999";
    clone.style.background = "#ffffff";
    clone.style.overflow = "hidden";
    document.body.appendChild(clone);

    try {
      // High-resolution canvas capture at 2.5x scale
      const canvas = await html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        windowWidth: 794,
        windowHeight: 1123,
      });

      const imgData = canvas.toDataURL("image/png");

      if (i > 0) {
        pdf.addPage("a4", "p");
      }

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
    } finally {
      clone.remove();
    }
  }

  pdf.save(filename);
}
