/**
 * Ultimate Graphics Billing Management System
 * High-Fidelity Multi-Page Vector Print & PDF Utilities
 *
 * Provides dedicated iframe-isolated printing that eliminates browser headers/footers,
 * paginates multi-sheet quotations and invoices cleanly without clipping, and guarantees exact A4 dimensions.
 */

export function printInvoiceDocument(elementId: string = "printable-invoice-sheet"): void {
  if (typeof window === "undefined") return;

  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.warn(`[printInvoiceDocument] Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Remove any pre-existing print iframe
  const existingFrame = document.getElementById("ug-isolated-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create an invisible, isolated iframe for printing
  const iframe = document.createElement("iframe");
  iframe.id = "ug-isolated-print-frame";
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "210mm";
  iframe.style.height = "auto";
  iframe.style.minHeight = "297mm";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Gather all active stylesheets and inline styles from main document
  const headElements = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  // Exact A4 CSS with margin: 0 to suppress browser header/footer (date, title, URL)
  // and page-break-after: always on individual A4 sheets
  const printStyleSheet = `
    <style>
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }

      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        width: 210mm !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: visible !important;
      }

      .print-container {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .a4-sheet {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 10mm 12mm 10mm 12mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        box-sizing: border-box !important;
        transform: none !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
      }

      .a4-sheet:last-of-type {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      .avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Force background contrast preservation */
      .bg-slate-950 { background-color: #020617 !important; }
      .bg-slate-900 { background-color: #0f172a !important; }
      .bg-slate-100 { background-color: #f1f5f9 !important; }
      .bg-slate-50  { background-color: #f8fafc !important; }
      .text-white   { color: #ffffff !important; }
    </style>
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ultimate Graphics — Document Print</title>
        ${headElements}
        ${printStyleSheet}
      </head>
      <body>
        ${sourceElement.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Allow styles and embedded images (monogram, logo, QR code) to finish layout
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe print invocation failed, using direct window print", e);
      window.print();
    } finally {
      // Clean up iframe after print dialog completes
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }
  }, 450);
}
